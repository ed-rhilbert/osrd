use crate::error::Result;
use crate::models::electrical_profiles::{ElectricalProfileSet, LightElectricalProfileSet};
use crate::models::{Create, Delete, Retrieve};
use crate::schema::electrical_profiles::ElectricalProfileSetData;
use crate::DbPool;
use crate::DieselJson;

use actix_web::dev::HttpServiceFactory;
use actix_web::web::{self, Data, Json, Path, Query};
use actix_web::{delete, get, post, HttpResponse};
use editoast_derive::EditoastError;
use serde::Deserialize;
use std::collections::HashMap;
use thiserror::Error;

/// Returns `/electrical_profile_set` routes
pub fn routes() -> impl HttpServiceFactory {
    web::scope("/electrical_profile_set").service((
        delete,
        list,
        get,
        get_level_order,
        post_electrical_profile,
    ))
}

/// Return a list of electrical profile sets
#[get("")]
async fn list(db_pool: Data<DbPool>) -> Result<Json<Vec<LightElectricalProfileSet>>> {
    let mut conn = db_pool.get().await?;
    Ok(Json(ElectricalProfileSet::list_light(&mut conn).await?))
}

/// Return a specific set of electrical profiles
#[get("/{electrical_profile_set}")]
async fn get(
    db_pool: Data<DbPool>,
    electrical_profile_set: Path<i64>,
) -> Result<Json<ElectricalProfileSetData>> {
    let electrical_profile_set_id = electrical_profile_set.into_inner();
    let ep_set = ElectricalProfileSet::retrieve(db_pool, electrical_profile_set_id)
        .await?
        .ok_or(ElectricalProfilesError::NotFound {
            electrical_profile_set_id,
        })?;
    Ok(Json(ep_set.data.unwrap().0))
}

/// Return the electrical profile value order for this set
#[get("/{electrical_profile_set}/level_order")]
async fn get_level_order(
    db_pool: Data<DbPool>,
    electrical_profile_set: Path<i64>,
) -> Result<Json<HashMap<String, Vec<String>>>> {
    let electrical_profile_set_id = electrical_profile_set.into_inner();
    let ep_set = ElectricalProfileSet::retrieve(db_pool, electrical_profile_set_id)
        .await?
        .ok_or(ElectricalProfilesError::NotFound {
            electrical_profile_set_id,
        })?;
    Ok(Json(ep_set.data.unwrap().0.level_order))
}

/// Delete an electrical profile set
#[delete("/{electrical_profile_set}")]
async fn delete(db_pool: Data<DbPool>, electrical_profile_set: Path<i64>) -> Result<HttpResponse> {
    let electrical_profile_set_id = electrical_profile_set.into_inner();
    let deleted = ElectricalProfileSet::delete(db_pool, electrical_profile_set_id).await?;
    if deleted {
        Ok(HttpResponse::NoContent().finish())
    } else {
        Ok(HttpResponse::NotFound().finish())
    }
}

#[derive(Deserialize)]
struct ElectricalProfileQueryArgs {
    name: String,
}

/// import electrical profile set
#[post("")]
async fn post_electrical_profile(
    db_pool: Data<DbPool>,
    ep_set_name: Query<ElectricalProfileQueryArgs>,
    data: Json<ElectricalProfileSetData>,
) -> Result<Json<ElectricalProfileSet>> {
    let ep_set = ElectricalProfileSet {
        name: Some(ep_set_name.into_inner().name),
        data: Some(DieselJson(data.into_inner())),
        ..Default::default()
    };
    Ok(Json(ep_set.create(db_pool).await.unwrap()))
}

#[derive(Debug, Error, EditoastError)]
#[editoast_error(base_id = "electrical_profiles")]
pub enum ElectricalProfilesError {
    /// Couldn't find the electrical profile set with the given id
    #[error("Electrical Profile Set '{electrical_profile_set_id}', could not be found")]
    #[editoast_error(status = 404)]
    NotFound { electrical_profile_set_id: i64 },
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures::tests::{
        db_pool, dummy_electrical_profile_set, electrical_profile_set, TestFixture,
    };
    use crate::schema::electrical_profiles::ElectricalProfile;
    use crate::views::tests::create_test_service;
    use actix_http::StatusCode;
    use actix_web::test as actix_test;
    use actix_web::test::TestRequest;
    use actix_web::test::{call_service, read_body_json};

    use crate::schema::TrackRange;
    use rstest::rstest;

    #[rstest]
    async fn test_list(
        #[future] electrical_profile_set: TestFixture<ElectricalProfileSet>,
        #[future] dummy_electrical_profile_set: TestFixture<ElectricalProfileSet>,
    ) {
        let _set_1 = electrical_profile_set.await;
        let _set_2 = dummy_electrical_profile_set.await;

        let app = create_test_service().await;
        let req = TestRequest::get()
            .uri("/electrical_profile_set")
            .to_request();
        let response = call_service(&app, req).await;
        assert_eq!(response.status(), StatusCode::OK);

        assert!(
            read_body_json::<Vec<LightElectricalProfileSet>, _>(response)
                .await
                .len()
                >= 2
        );
    }

    #[actix_test]
    async fn test_get_none() {
        let app = create_test_service().await;
        let req = TestRequest::get()
            .uri("/electrical_profile_set/666")
            .to_request();
        let response = call_service(&app, req).await;
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[rstest]
    async fn test_get_some(
        #[future] dummy_electrical_profile_set: TestFixture<ElectricalProfileSet>,
    ) {
        let profile_set = dummy_electrical_profile_set.await;

        let app = create_test_service().await;
        let req = TestRequest::get()
            .uri(&format!("/electrical_profile_set/{}", profile_set.id()))
            .to_request();
        let response = call_service(&app, req).await;
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[actix_test]
    async fn test_get_level_order_none() {
        let app = create_test_service().await;
        let req = TestRequest::get()
            .uri("/electrical_profile_set/666/level_order")
            .to_request();
        let response = call_service(&app, req).await;
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[rstest]
    async fn test_get_level_order_some(
        #[future] electrical_profile_set: TestFixture<ElectricalProfileSet>,
    ) {
        let profile_set = electrical_profile_set.await;
        let app = create_test_service().await;
        let req = TestRequest::get()
            .uri(&format!(
                "/electrical_profile_set/{}/level_order",
                profile_set.id()
            ))
            .to_request();
        let response = call_service(&app, req).await;
        assert_eq!(response.status(), StatusCode::OK);
        let level_order = read_body_json::<HashMap<String, Vec<String>>, _>(response).await;
        assert_eq!(level_order.len(), 1);
        assert_eq!(
            level_order.get("25000").unwrap(),
            &vec!["25000", "22500", "20000"]
        );
    }

    #[rstest]
    async fn test_delete_none() {
        let app = create_test_service().await;
        let req = TestRequest::delete()
            .uri("/electrical_profile_set/666")
            .to_request();
        let response = call_service(&app, req).await;
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[rstest]
    async fn test_delete_some(
        #[future] dummy_electrical_profile_set: TestFixture<ElectricalProfileSet>,
    ) {
        let profile_set = dummy_electrical_profile_set.await;
        let app = create_test_service().await;
        let req = TestRequest::delete()
            .uri(&format!("/electrical_profile_set/{}", profile_set.id()))
            .to_request();
        let response = call_service(&app, req).await;
        assert_eq!(response.status(), StatusCode::NO_CONTENT);

        assert!(ElectricalProfileSet::retrieve(db_pool(), profile_set.id())
            .await
            .unwrap()
            .is_none());
    }

    #[rstest]
    async fn test_post(db_pool: Data<DbPool>) {
        let app = create_test_service().await;
        let ep_set = ElectricalProfileSetData {
            levels: vec![ElectricalProfile {
                value: "A".to_string(),
                power_class: "1".to_string(),
                track_ranges: vec![TrackRange::default()],
            }],
            level_order: Default::default(),
        };
        let req = TestRequest::post()
            .uri("/electrical_profile_set/?name=elec")
            .set_json(ep_set)
            .to_request();

        let response = call_service(&app, req).await;
        assert_eq!(response.status(), StatusCode::OK);
        let created_ep_set = TestFixture::<ElectricalProfileSet> {
            model: read_body_json(response).await,
            db_pool,
            infra: None,
        };
        assert_eq!(created_ep_set.model.name.clone().unwrap(), "elec");
    }
}
