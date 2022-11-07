use diesel::sql_types::{Array, Integer, Json};
use diesel::{sql_query, PgConnection, RunQueryDsl};

use crate::infra_cache::InfraCache;
use crate::schema::{InfraError, ObjectRef, ObjectType};
use diesel::result::Error as DieselError;
use serde_json::{to_value, Value};

pub fn insert_errors(
    conn: &PgConnection,
    infra_id: i32,
    infra_cache: &InfraCache,
) -> Result<(), DieselError> {
    let infra_errors = generate_errors(infra_cache);

    let errors: Vec<Value> = infra_errors
        .iter()
        .map(|error| to_value(error).unwrap())
        .collect();

    let count = sql_query(include_str!("sql/buffer_stops_insert_errors.sql"))
        .bind::<Integer, _>(infra_id)
        .bind::<Array<Json>, _>(&errors)
        .execute(conn)?;
    assert_eq!(count, infra_errors.len());
    Ok(())
}

pub fn generate_errors(infra_cache: &InfraCache) -> Vec<InfraError> {
    let mut errors = vec![];

    for buffer_stop in infra_cache.buffer_stops().values() {
        let buffer_stop = buffer_stop.unwrap_buffer_stop();
        // Retrieve invalid refs
        if !infra_cache
            .track_sections()
            .contains_key(&buffer_stop.track)
        {
            let obj_ref = ObjectRef::new(ObjectType::TrackSection, buffer_stop.track.clone());
            let infra_error = InfraError::new_invalid_reference(buffer_stop, "track", obj_ref);
            errors.push(infra_error);
            continue;
        }

        let track_cache = infra_cache
            .track_sections()
            .get(&buffer_stop.track)
            .unwrap()
            .unwrap_track_section();
        // Retrieve out of range
        if !(0.0..=track_cache.length).contains(&buffer_stop.position) {
            let infra_error = InfraError::new_out_of_range(
                buffer_stop,
                "position",
                buffer_stop.position,
                [0.0, track_cache.length],
            );
            errors.push(infra_error);
        }
    }

    errors
}

#[cfg(test)]
mod tests {
    use super::generate_errors;
    use super::InfraError;
    use crate::infra_cache::tests::{create_buffer_stop_cache, create_small_infra_cache};
    use crate::schema::{ObjectRef, ObjectType};

    #[test]
    fn invalid_ref() {
        let mut infra_cache = create_small_infra_cache();
        let bf = create_buffer_stop_cache("BF_error", "E", 250.);
        infra_cache.add(bf.clone());
        let errors = generate_errors(&infra_cache);
        assert_eq!(1, errors.len());
        let obj_ref = ObjectRef::new(ObjectType::TrackSection, "E");
        let infra_error = InfraError::new_invalid_reference(&bf, "track", obj_ref);
        assert_eq!(infra_error, errors[0]);
    }

    #[test]
    fn out_of_range() {
        let mut infra_cache = create_small_infra_cache();
        let bf = create_buffer_stop_cache("BF_error", "A", 530.);
        infra_cache.add(bf.clone());
        let errors = generate_errors(&infra_cache);
        assert_eq!(1, errors.len());
        let infra_error = InfraError::new_out_of_range(&bf, "position", 530., [0.0, 500.]);
        assert_eq!(infra_error, errors[0]);
    }
}