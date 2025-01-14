pub mod light_rolling_stock;
pub mod rolling_stock_image;
pub mod rolling_stock_livery;

use async_trait::async_trait;
pub use light_rolling_stock::LightRollingStockModel;
pub use rolling_stock_image::RollingStockSeparatedImageModel;
pub use rolling_stock_livery::RollingStockLiveryModel;

use crate::error::{InternalError, Result};
use crate::models::rolling_stock::rolling_stock_livery::RollingStockLiveryMetadata;
use crate::models::{Create, Identifiable, TextArray, Update};
use crate::schema::rolling_stock::{
    EffortCurves, EnergySource, Gamma, RollingResistance, RollingStock, RollingStockCommon,
    RollingStockMetadata, RollingStockWithLiveries,
};
use crate::tables::rolling_stock;
use crate::views::rolling_stocks::RollingStockError;
use crate::DbPool;
use actix_web::web::Data;
use derivative::Derivative;
use diesel::result::{DatabaseErrorInformation, DatabaseErrorKind, Error as DieselError};
use diesel::{insert_into, update, ExpressionMethods, QueryDsl, SelectableHelper};
use diesel_async::{AsyncPgConnection as PgConnection, RunQueryDsl};
use diesel_json::Json as DieselJson;
use editoast_derive::Model;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

#[derive(
    AsChangeset,
    Clone,
    Debug,
    Derivative,
    Deserialize,
    Identifiable,
    Insertable,
    Model,
    Queryable,
    Serialize,
)]
#[derivative(Default, PartialEq)]
#[model(table = "rolling_stock")]
#[model(retrieve, delete)]
#[diesel(table_name = rolling_stock)]
pub struct RollingStockModel {
    #[diesel(deserialize_as = i64)]
    pub id: Option<i64>,
    #[diesel(deserialize_as = String)]
    pub railjson_version: Option<String>,
    #[derivative(PartialEq = "ignore")]
    #[diesel(deserialize_as = String)]
    pub name: Option<String>,
    #[diesel(deserialize_as = DieselJson<EffortCurves>)]
    pub effort_curves: Option<DieselJson<EffortCurves>>,
    #[derivative(PartialEq = "ignore")]
    #[diesel(deserialize_as = DieselJson<RollingStockMetadata>)]
    pub metadata: Option<DieselJson<RollingStockMetadata>>,
    #[diesel(deserialize_as = f64)]
    pub length: Option<f64>,
    #[diesel(deserialize_as = f64)]
    pub max_speed: Option<f64>,
    #[diesel(deserialize_as = f64)]
    pub startup_time: Option<f64>,
    #[diesel(deserialize_as = f64)]
    pub startup_acceleration: Option<f64>,
    #[diesel(deserialize_as = f64)]
    pub comfort_acceleration: Option<f64>,
    #[diesel(deserialize_as = DieselJson<Gamma>)]
    pub gamma: Option<DieselJson<Gamma>>,
    #[diesel(deserialize_as = f64)]
    pub inertia_coefficient: Option<f64>,
    #[diesel(deserialize_as = Option<String>)]
    pub base_power_class: Option<Option<String>>,
    #[diesel(deserialize_as = TextArray)]
    pub features: Option<Vec<String>>,
    #[diesel(deserialize_as = f64)]
    pub mass: Option<f64>,
    #[diesel(deserialize_as = DieselJson<RollingResistance>)]
    pub rolling_resistance: Option<DieselJson<RollingResistance>>,
    #[diesel(deserialize_as = String)]
    pub loading_gauge: Option<String>,
    #[diesel(deserialize_as = Option<JsonValue>)]
    pub power_restrictions: Option<Option<JsonValue>>,
    #[diesel(deserialize_as = DieselJson<Vec<EnergySource>>)]
    pub energy_sources: Option<DieselJson<Vec<EnergySource>>>,
    #[derivative(PartialEq = "ignore")]
    #[diesel(deserialize_as = bool)]
    pub locked: Option<bool>,
    #[diesel(deserialize_as = Option<f64>)]
    pub electrical_power_startup_time: Option<Option<f64>>,
    #[diesel(deserialize_as = Option<f64>)]
    pub raise_pantograph_time: Option<Option<f64>>,
    #[derivative(Default(value = "None"))]
    #[derivative(PartialEq = "ignore")]
    #[diesel(deserialize_as = i64)]
    pub version: Option<i64>,
}

impl Identifiable for RollingStockModel {
    fn get_id(&self) -> i64 {
        self.id.expect("Id not found")
    }
}

impl RollingStockModel {
    pub async fn with_liveries(self, db_pool: Data<DbPool>) -> Result<RollingStockWithLiveries> {
        use crate::tables::rolling_stock_livery::dsl as livery_dsl;
        let mut conn = db_pool.get().await?;
        let liveries = livery_dsl::rolling_stock_livery
            .filter(livery_dsl::rolling_stock_id.eq(self.id.unwrap()))
            .select(RollingStockLiveryMetadata::as_select())
            .load(&mut conn)
            .await?;
        Ok(RollingStockWithLiveries {
            rolling_stock: self.into(),
            liveries,
        })
    }

    /// Retrieve a rolling stock by its name
    pub async fn retrieve_by_name(
        conn: &mut PgConnection,
        rs_name: String,
    ) -> Result<Option<Self>> {
        use crate::tables::rolling_stock::dsl::*;
        match rolling_stock
            .filter(name.eq(rs_name))
            .get_result::<Self>(conn)
            .await
        {
            Ok(rs) => Ok(Some(rs)),
            Err(DieselError::NotFound) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }
}

fn is_given_constraint(
    error_info: &(dyn DatabaseErrorInformation + Send + Sync),
    column_name: &str,
) -> bool {
    error_info
        .constraint_name()
        .map(|name| name == column_name)
        .unwrap_or(false)
}

fn map_diesel_error(e: DieselError, rs_name: String) -> InternalError {
    match e {
        DieselError::DatabaseError(DatabaseErrorKind::UniqueViolation, info)
            if is_given_constraint(info.as_ref(), "rolling_stock_name_key") =>
        {
            RollingStockError::NameAlreadyUsed { name: rs_name }.into()
        }
        DieselError::DatabaseError(DatabaseErrorKind::CheckViolation, info)
            if is_given_constraint(info.as_ref(), "base_power_class_null_or_non_empty") =>
        {
            RollingStockError::BasePowerClassEmpty.into()
        }
        e => e.into(),
    }
}

#[async_trait]
impl Update for RollingStockModel {
    async fn update_conn(
        self,
        conn: &mut PgConnection,
        rolling_stock_id: i64,
    ) -> Result<Option<Self>> {
        use crate::tables::rolling_stock::dsl::*;

        match update(rolling_stock.find(rolling_stock_id))
            .set(&self)
            .get_result::<RollingStockModel>(conn)
            .await
        {
            Ok(rs) => Ok(Some(rs)),
            Err(DieselError::NotFound) => Ok(None),
            Err(e) => Err(map_diesel_error(e, self.name.unwrap())),
        }
    }
}

#[async_trait]
impl Create for RollingStockModel {
    async fn create_conn(self, conn: &mut PgConnection) -> Result<Self> {
        use crate::tables::rolling_stock::dsl::*;
        match insert_into(rolling_stock)
            .values(&self)
            .get_result(conn)
            .await
        {
            Ok(rs) => Ok(rs),
            Err(e) => Err(map_diesel_error(e, self.name.unwrap())),
        }
    }
}

impl From<RollingStockModel> for RollingStockCommon {
    fn from(rolling_stock_model: RollingStockModel) -> Self {
        RollingStockCommon {
            name: rolling_stock_model.name.unwrap(),
            effort_curves: rolling_stock_model.effort_curves.unwrap().0,
            base_power_class: rolling_stock_model.base_power_class.unwrap(),
            length: rolling_stock_model.length.unwrap(),
            max_speed: rolling_stock_model.max_speed.unwrap(),
            startup_time: rolling_stock_model.startup_time.unwrap(),
            startup_acceleration: rolling_stock_model.startup_acceleration.unwrap(),
            comfort_acceleration: rolling_stock_model.comfort_acceleration.unwrap(),
            gamma: rolling_stock_model.gamma.unwrap().0,
            inertia_coefficient: rolling_stock_model.inertia_coefficient.unwrap(),
            features: rolling_stock_model.features.unwrap(),
            mass: rolling_stock_model.mass.unwrap(),
            rolling_resistance: rolling_stock_model.rolling_resistance.unwrap().0,
            loading_gauge: rolling_stock_model.loading_gauge.unwrap(),
            power_restrictions: rolling_stock_model.power_restrictions.unwrap(),
            energy_sources: rolling_stock_model.energy_sources.unwrap().0,
            electrical_power_startup_time: rolling_stock_model
                .electrical_power_startup_time
                .unwrap(),
            raise_pantograph_time: rolling_stock_model.raise_pantograph_time.unwrap(),
        }
    }
}

impl From<RollingStockModel> for RollingStock {
    fn from(rolling_stock_model: RollingStockModel) -> Self {
        let rolling_stock_common: RollingStockCommon = rolling_stock_model.clone().into();
        RollingStock {
            id: rolling_stock_model.id.unwrap(),
            common: rolling_stock_common,
            railjson_version: rolling_stock_model.railjson_version.unwrap(),
            locked: rolling_stock_model.locked.unwrap(),
            metadata: rolling_stock_model.metadata.unwrap().0,
        }
    }
}

#[cfg(test)]
pub mod tests {
    use crate::error::InternalError;
    use crate::fixtures::tests::{db_pool, fast_rolling_stock, other_rolling_stock, TestFixture};
    use crate::models::{Retrieve, Update};
    use crate::views::rolling_stocks::RollingStockError;
    use crate::DbPool;
    use rstest::*;
    use serde_json::to_value;

    use super::RollingStockModel;
    use actix_web::web::Data;

    pub fn get_fast_rolling_stock() -> RollingStockModel {
        serde_json::from_str(include_str!("../../tests/example_rolling_stock_1.json"))
            .expect("Unable to parse")
    }

    pub fn get_other_rolling_stock() -> RollingStockModel {
        serde_json::from_str(include_str!(
            "../../tests/example_rolling_stock_2_energy_sources.json"
        ))
        .expect("Unable to parse")
    }

    pub fn get_invalid_effort_curves() -> &'static str {
        include_str!("../../tests/example_rolling_stock_3.json")
    }

    #[rstest]
    async fn create_delete_rolling_stock(
        db_pool: Data<DbPool>,
        #[future] fast_rolling_stock: TestFixture<RollingStockModel>,
    ) {
        let rolling_stock_id: i64;
        {
            let rolling_stock = fast_rolling_stock.await;
            rolling_stock_id = rolling_stock.id();
            assert_eq!(
                "fast_rolling_stock",
                rolling_stock.model.name.clone().unwrap()
            );
        }
        assert!(RollingStockModel::retrieve(db_pool, rolling_stock_id)
            .await
            .unwrap()
            .is_none());
    }

    #[rstest]
    async fn update_rolling_stock(
        db_pool: Data<DbPool>,
        #[future] fast_rolling_stock: TestFixture<RollingStockModel>,
    ) {
        let rolling_stock = fast_rolling_stock.await;
        let rolling_stock_id = rolling_stock.id();

        let mut updated_rolling_stock = get_other_rolling_stock();
        updated_rolling_stock.id = Some(rolling_stock_id);

        let updated_rolling_stock = updated_rolling_stock
            .update(db_pool, rolling_stock_id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(updated_rolling_stock.name.unwrap(), "other_rolling_stock");
    }

    #[rstest]
    async fn update_rolling_stock_failure_name_already_used(
        db_pool: Data<DbPool>,
        #[future] fast_rolling_stock: TestFixture<RollingStockModel>,
        #[future] other_rolling_stock: TestFixture<RollingStockModel>,
    ) {
        let _rolling_stock = fast_rolling_stock.await;
        let other_rolling_stock = other_rolling_stock.await;

        let other_rolling_stock_id = other_rolling_stock.id();
        let mut other_rolling_stock =
            RollingStockModel::retrieve(db_pool.clone(), other_rolling_stock_id)
                .await
                .unwrap()
                .unwrap();
        other_rolling_stock.name = Some(String::from("fast_rolling_stock"));

        let result = other_rolling_stock
            .update(db_pool.clone(), other_rolling_stock_id)
            .await;
        let error: InternalError = RollingStockError::NameAlreadyUsed {
            name: String::from("fast_rolling_stock"),
        }
        .into();
        assert_eq!(
            to_value(result.unwrap_err()).unwrap(),
            to_value(error).unwrap()
        );
    }
}
