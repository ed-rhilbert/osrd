use crate::error::Result;
use crate::schema::rolling_stock_livery::RollingStockLiveryMetadata;
use crate::schema::rolling_stock_schema::rolling_stock::{
    Gamma, RollingResistance, RollingStock, RollingStockMetadata, RollingStockWithLiveries,
};
use crate::tables::osrd_infra_rollingstock;
use crate::DbPool;
use actix_web::web::{block, Data};
use derivative::Derivative;
use diesel::result::Error as DieselError;
use diesel::ExpressionMethods;
use diesel::SelectableHelper;
use diesel::{QueryDsl, RunQueryDsl};
use diesel_json::Json as DieselJson;
use editoast_derive::Model;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

#[derive(Debug, Derivative, Deserialize, Identifiable, Insertable, Model, Queryable, Serialize)]
#[derivative(Default)]
#[model(table = "osrd_infra_rollingstock")]
#[model(create, retrieve, delete)]
#[diesel(table_name = osrd_infra_rollingstock)]
pub struct RollingStockModel {
    #[diesel(deserialize_as = i64)]
    pub id: Option<i64>,
    #[diesel(deserialize_as = String)]
    pub name: Option<String>,
    #[diesel(deserialize_as = String)]
    pub version: Option<String>,
    #[diesel(deserialize_as = JsonValue)]
    pub effort_curves: Option<JsonValue>,
    #[diesel(deserialize_as = String)]
    pub base_power_class: Option<String>,
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
    #[diesel(deserialize_as = Vec<String>)]
    pub features: Option<Vec<String>>,
    #[diesel(deserialize_as = f64)]
    pub mass: Option<f64>,
    #[diesel(deserialize_as = DieselJson<RollingResistance>)]
    pub rolling_resistance: Option<DieselJson<RollingResistance>>,
    #[diesel(deserialize_as = String)]
    pub loading_gauge: Option<String>,
    #[diesel(deserialize_as = DieselJson<RollingStockMetadata>)]
    pub metadata: Option<DieselJson<RollingStockMetadata>>,
    #[diesel(deserialize_as = Option<JsonValue>)]
    pub power_restrictions: Option<Option<JsonValue>>,
}

impl RollingStockModel {
    pub async fn with_liveries(self, db_pool: Data<DbPool>) -> Result<RollingStockWithLiveries> {
        block::<_, Result<_>>(move || {
            use crate::tables::osrd_infra_rollingstocklivery::dsl as livery_dsl;
            let mut conn = db_pool.get()?;
            let liveries = livery_dsl::osrd_infra_rollingstocklivery
                .filter(livery_dsl::rolling_stock_id.eq(self.id.unwrap()))
                .select(RollingStockLiveryMetadata::as_select())
                .load(&mut conn)?;
            Ok(RollingStockWithLiveries {
                rolling_stock: self.into(),
                liveries,
            })
        })
        .await
        .unwrap()
    }
}

impl From<RollingStockModel> for RollingStock {
    fn from(rolling_stock_model: RollingStockModel) -> Self {
        RollingStock {
            id: rolling_stock_model.id.unwrap(),
            name: rolling_stock_model.name.unwrap(),
            version: rolling_stock_model.version.unwrap(),
            effort_curves: rolling_stock_model.effort_curves.unwrap(),
            base_power_class: rolling_stock_model.base_power_class.unwrap(),
            length: rolling_stock_model.length.unwrap(),
            max_speed: rolling_stock_model.max_speed.unwrap(),
            startup_time: rolling_stock_model.startup_time.unwrap(),
            startup_acceleration: rolling_stock_model.startup_acceleration.unwrap(),
            comfort_acceleration: rolling_stock_model.comfort_acceleration.unwrap(),
            gamma: rolling_stock_model.gamma.unwrap(),
            inertia_coefficient: rolling_stock_model.inertia_coefficient.unwrap(),
            features: rolling_stock_model.features.unwrap(),
            mass: rolling_stock_model.mass.unwrap(),
            rolling_resistance: rolling_stock_model.rolling_resistance.unwrap(),
            loading_gauge: rolling_stock_model.loading_gauge.unwrap(),
            metadata: rolling_stock_model.metadata.unwrap(),
            power_restrictions: rolling_stock_model.power_restrictions.unwrap(),
        }
    }
}

#[cfg(test)]
pub mod tests {
    use crate::client::PostgresConfig;
    use crate::models::{Create, Delete, Retrieve};
    use actix_web::test as actix_test;
    use diesel::result::Error;
    use diesel::Connection;
    use diesel::PgConnection;

    use super::RollingStockModel;

    pub fn test_rolling_stock_transaction(
        rolling_stock_name: String,
        fn_test: fn(&mut PgConnection, RollingStockModel),
    ) {
        let mut conn = PgConnection::establish(&PostgresConfig::default().url()).unwrap();
        conn.test_transaction::<_, Error, _>(|conn| {
            let rolling_stock = get_rolling_stock_example(rolling_stock_name);
            let rolling_stock = RollingStockModel::create_conn(rolling_stock, conn).unwrap();

            fn_test(conn, rolling_stock);
            Ok(())
        });
    }

    pub fn get_rolling_stock_example(rolling_stock_name: String) -> RollingStockModel {
        let mut rolling_stock: RollingStockModel =
            serde_json::from_str(include_str!("../../tests/example_rolling_stock.json"))
                .expect("Unable to parse");
        rolling_stock.name = Some(rolling_stock_name);
        rolling_stock
    }

    #[actix_test]
    async fn create_delete_rolling_stock() {
        let mut conn = PgConnection::establish(&PostgresConfig::default().url()).unwrap();
        conn.test_transaction::<_, Error, _>(|conn| {
            let rolling_stock_form =
                get_rolling_stock_example(String::from("model_create_delete_rolling_stock"));
            let rolling_stock = RollingStockModel::create_conn(rolling_stock_form, conn).unwrap();
            assert_eq!(
                "model_create_delete_rolling_stock",
                rolling_stock.name.unwrap()
            );

            assert!(RollingStockModel::delete_conn(conn, rolling_stock.id.unwrap()).is_ok());
            assert!(!RollingStockModel::delete_conn(conn, rolling_stock.id.unwrap()).unwrap());
            Ok(())
        });
    }

    #[actix_test]
    async fn get_rolling_stock() {
        test_rolling_stock_transaction(
            String::from("model_get_rolling_stock"),
            |conn, rolling_stock| {
                let rolling_stock_retrieved =
                    RollingStockModel::retrieve_conn(conn, rolling_stock.id.unwrap())
                        .unwrap()
                        .unwrap();
                assert_eq!(
                    rolling_stock_retrieved.name.unwrap(),
                    rolling_stock.name.unwrap()
                );
                assert!(RollingStockModel::delete_conn(conn, rolling_stock.id.unwrap()).is_ok());
                assert!(
                    RollingStockModel::retrieve_conn(conn, rolling_stock.id.unwrap())
                        .unwrap()
                        .is_none()
                );
            },
        )
    }
}