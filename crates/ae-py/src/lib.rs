use pyo3::create_exception;
use pyo3::exceptions::PyException;
use pyo3::prelude::*;
use pyo3::types::PyBytes;

#[pyfunction]
fn transform<'py>(py: Python<'py>, input: &[u8]) -> Bound<'py, PyBytes> {
    PyBytes::new(py, &ae_core::transform(input))
}

#[pyclass(get_all)]
#[derive(Clone)]
struct Frame {
    len: u32,
    checksum: u32,
    payload: Vec<u8>,
}

create_exception!(ae_py, DecodeError, PyException);

#[pyfunction]
fn decode(input: &[u8]) -> PyResult<Frame> {
    ae_core::decode(input)
        .map(|f| Frame {
            len: f.len,
            checksum: f.checksum,
            payload: f.payload,
        })
        .map_err(|e| match e {
            ae_core::DecodeError::TooShort => DecodeError::new_err("too-short"),
            ae_core::DecodeError::ChecksumMismatch => DecodeError::new_err("checksum-mismatch"),
        })
}

#[pymodule]
fn ae_py(py: Python<'_>, m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(transform, m)?)?;
    m.add_function(wrap_pyfunction!(decode, m)?)?;
    m.add_class::<Frame>()?;
    m.add("DecodeError", py.get_type::<DecodeError>())?;
    Ok(())
}
