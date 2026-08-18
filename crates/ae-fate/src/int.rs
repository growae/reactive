//! Arbitrary-precision signed integers.
//!
//! FATE integers are unbounded, so a fixed-width Rust integer cannot hold every
//! value the wire format admits. This is a deliberately small sign-and-magnitude
//! implementation carrying only the operations the codec needs — comparison,
//! `± 64`, and decimal conversion — rather than a general bignum dependency, so
//! the crate stays dependency-free and cheap to compile to WebAssembly.

use crate::error::{Error, Result};
use core::cmp::Ordering;
use core::fmt;
use core::str::FromStr;

/// A FATE integer.
///
/// Zero is always stored with `negative == false` and an empty magnitude, so
/// derived equality is the same as numeric equality.
#[derive(Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct FateInt {
    negative: bool,
    /// Big-endian magnitude with no leading zero bytes. Empty means zero.
    magnitude: Vec<u8>,
}

impl FateInt {
    /// The additive identity.
    pub fn zero() -> Self {
        Self::default()
    }

    /// Builds an integer from a sign and a big-endian magnitude.
    ///
    /// Leading zero bytes are stripped, and a zero magnitude always yields
    /// positive zero.
    pub fn from_sign_magnitude(negative: bool, magnitude: &[u8]) -> Self {
        let magnitude = normalise(magnitude);
        Self {
            negative: negative && !magnitude.is_empty(),
            magnitude,
        }
    }

    /// True when the value is strictly below zero.
    pub fn is_negative(&self) -> bool {
        self.negative
    }

    /// True when the value is zero.
    pub fn is_zero(&self) -> bool {
        self.magnitude.is_empty()
    }

    /// The big-endian magnitude, without leading zero bytes. Empty for zero.
    pub fn magnitude_be(&self) -> &[u8] {
        &self.magnitude
    }

    /// The absolute value.
    pub fn abs(&self) -> Self {
        Self {
            negative: false,
            magnitude: self.magnitude.clone(),
        }
    }

    /// True when `|self| < n`.
    pub fn abs_below(&self, n: u64) -> bool {
        cmp_magnitude(&self.magnitude, &magnitude_from_u64(n)) == Ordering::Less
    }

    /// `|self| - n`, as a magnitude. Returns `None` when `|self| < n`.
    pub(crate) fn magnitude_minus(&self, n: u64) -> Option<Vec<u8>> {
        let rhs = magnitude_from_u64(n);
        match cmp_magnitude(&self.magnitude, &rhs) {
            Ordering::Less => None,
            _ => Some(subtract_magnitudes(&self.magnitude, &rhs)),
        }
    }

    /// Builds `±(magnitude + n)`.
    pub(crate) fn from_magnitude_plus(negative: bool, magnitude: &[u8], n: u64) -> Self {
        let sum = add_magnitudes(&normalise(magnitude), &magnitude_from_u64(n));
        Self::from_sign_magnitude(negative, &sum)
    }

    /// The value as an `i128`, or `None` when it does not fit.
    pub fn to_i128(&self) -> Option<i128> {
        if self.magnitude.len() > 16 {
            return None;
        }
        let mut acc: u128 = 0;
        for byte in &self.magnitude {
            acc = (acc << 8) | u128::from(*byte);
        }
        if self.negative {
            if acc > (i128::MAX as u128) + 1 {
                None
            } else if acc == (i128::MAX as u128) + 1 {
                Some(i128::MIN)
            } else {
                Some(-(acc as i128))
            }
        } else if acc > i128::MAX as u128 {
            None
        } else {
            Some(acc as i128)
        }
    }

    /// The value as a `usize`, or `None` when it is negative or too large.
    pub fn to_usize(&self) -> Option<usize> {
        if self.negative {
            return None;
        }
        if self.magnitude.len() > core::mem::size_of::<usize>() {
            return None;
        }
        let mut acc: usize = 0;
        for byte in &self.magnitude {
            acc = (acc << 8) | usize::from(*byte);
        }
        Some(acc)
    }

    /// Parses a decimal string, with an optional leading `-`.
    pub fn parse_decimal(text: &str) -> Result<Self> {
        let (negative, digits) = match text.strip_prefix('-') {
            Some(rest) => (true, rest),
            None => (false, text.strip_prefix('+').unwrap_or(text)),
        };
        if digits.is_empty() || !digits.bytes().all(|b| b.is_ascii_digit()) {
            return Err(Error::InvalidInteger);
        }
        let mut magnitude: Vec<u8> = Vec::new();
        for byte in digits.bytes() {
            magnitude = multiply_add_magnitude(&magnitude, 10, u32::from(byte - b'0'));
        }
        Ok(Self::from_sign_magnitude(negative, &magnitude))
    }
}

impl Ord for FateInt {
    fn cmp(&self, other: &Self) -> Ordering {
        match (self.negative, other.negative) {
            (false, true) => Ordering::Greater,
            (true, false) => Ordering::Less,
            (false, false) => cmp_magnitude(&self.magnitude, &other.magnitude),
            (true, true) => cmp_magnitude(&other.magnitude, &self.magnitude),
        }
    }
}

impl PartialOrd for FateInt {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl fmt::Display for FateInt {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if self.is_zero() {
            return f.write_str("0");
        }
        let mut chunks: Vec<u32> = Vec::new();
        let mut rest = self.magnitude.clone();
        while !rest.is_empty() {
            let (quotient, remainder) = divide_magnitude(&rest, 1_000_000_000);
            chunks.push(remainder);
            rest = quotient;
        }
        let mut out = String::new();
        if self.negative {
            out.push('-');
        }
        let mut chunks = chunks.into_iter().rev();
        if let Some(first) = chunks.next() {
            out.push_str(&first.to_string());
        }
        for chunk in chunks {
            out.push_str(&format!("{chunk:09}"));
        }
        f.write_str(&out)
    }
}

impl FromStr for FateInt {
    type Err = Error;

    fn from_str(text: &str) -> Result<Self> {
        Self::parse_decimal(text)
    }
}

macro_rules! from_signed {
    ($($t:ty),*) => {$(
        impl From<$t> for FateInt {
            fn from(value: $t) -> Self {
                let negative = value < 0;
                let magnitude = (value as i128).unsigned_abs();
                Self::from_sign_magnitude(negative, &magnitude.to_be_bytes())
            }
        }
    )*};
}

macro_rules! from_unsigned {
    ($($t:ty),*) => {$(
        impl From<$t> for FateInt {
            fn from(value: $t) -> Self {
                Self::from_sign_magnitude(false, &(value as u128).to_be_bytes())
            }
        }
    )*};
}

from_signed!(i8, i16, i32, i64, i128);
from_unsigned!(u8, u16, u32, u64, u128, usize);

fn normalise(bytes: &[u8]) -> Vec<u8> {
    let first = bytes.iter().position(|b| *b != 0).unwrap_or(bytes.len());
    bytes[first..].to_vec()
}

fn magnitude_from_u64(value: u64) -> Vec<u8> {
    normalise(&value.to_be_bytes())
}

fn cmp_magnitude(a: &[u8], b: &[u8]) -> Ordering {
    a.len().cmp(&b.len()).then_with(|| a.cmp(b))
}

fn add_magnitudes(a: &[u8], b: &[u8]) -> Vec<u8> {
    let mut out = Vec::with_capacity(a.len().max(b.len()) + 1);
    let mut carry = 0u16;
    let mut ai = a.len();
    let mut bi = b.len();
    while ai > 0 || bi > 0 || carry > 0 {
        let mut sum = carry;
        if ai > 0 {
            ai -= 1;
            sum += u16::from(a[ai]);
        }
        if bi > 0 {
            bi -= 1;
            sum += u16::from(b[bi]);
        }
        out.push((sum & 0xff) as u8);
        carry = sum >> 8;
    }
    out.reverse();
    normalise(&out)
}

/// Requires `a >= b`.
fn subtract_magnitudes(a: &[u8], b: &[u8]) -> Vec<u8> {
    let mut out = Vec::with_capacity(a.len());
    let mut borrow = 0i16;
    let mut ai = a.len();
    let mut bi = b.len();
    while ai > 0 {
        ai -= 1;
        let mut diff = i16::from(a[ai]) - borrow;
        if bi > 0 {
            bi -= 1;
            diff -= i16::from(b[bi]);
        }
        if diff < 0 {
            diff += 256;
            borrow = 1;
        } else {
            borrow = 0;
        }
        out.push(diff as u8);
    }
    out.reverse();
    normalise(&out)
}

fn multiply_add_magnitude(a: &[u8], factor: u32, addend: u32) -> Vec<u8> {
    let mut out = Vec::with_capacity(a.len() + 4);
    let mut carry = u64::from(addend);
    for byte in a.iter().rev() {
        let product = u64::from(*byte) * u64::from(factor) + carry;
        out.push((product & 0xff) as u8);
        carry = product >> 8;
    }
    while carry > 0 {
        out.push((carry & 0xff) as u8);
        carry >>= 8;
    }
    out.reverse();
    normalise(&out)
}

/// Returns `(quotient, remainder)`. `divisor` must be non-zero.
fn divide_magnitude(a: &[u8], divisor: u32) -> (Vec<u8>, u32) {
    let mut quotient = Vec::with_capacity(a.len());
    let mut remainder = 0u64;
    for byte in a {
        remainder = (remainder << 8) | u64::from(*byte);
        quotient.push((remainder / u64::from(divisor)) as u8);
        remainder %= u64::from(divisor);
    }
    (normalise(&quotient), remainder as u32)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trips_through_decimal() {
        for text in [
            "0",
            "1",
            "-1",
            "63",
            "64",
            "-64",
            "255",
            "256",
            "18446744073709551616",
            "-170141183460469231731687303715884105728",
            "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        ] {
            let parsed = FateInt::parse_decimal(text).expect("parses");
            assert_eq!(parsed.to_string(), text, "round trip of {text}");
        }
    }

    #[test]
    fn rejects_non_decimal() {
        for text in ["", "-", "0x1f", "1_000", " 1", "1 "] {
            assert_eq!(FateInt::parse_decimal(text), Err(Error::InvalidInteger));
        }
    }

    #[test]
    fn orders_across_the_sign_boundary() {
        let mut values: Vec<FateInt> = ["5", "-5", "0", "1", "-1", "1000000000000000000000", "-2"]
            .iter()
            .map(|t| FateInt::parse_decimal(t).unwrap())
            .collect();
        values.sort();
        let rendered: Vec<String> = values.iter().map(FateInt::to_string).collect();
        assert_eq!(
            rendered,
            vec!["-5", "-2", "-1", "0", "1", "5", "1000000000000000000000"]
        );
    }

    #[test]
    fn converts_to_and_from_primitives() {
        assert_eq!(FateInt::from(0i64).to_i128(), Some(0));
        assert_eq!(FateInt::from(i128::MIN).to_i128(), Some(i128::MIN));
        assert_eq!(FateInt::from(i128::MAX).to_i128(), Some(i128::MAX));
        assert_eq!(FateInt::from(u128::MAX).to_i128(), None);
        assert_eq!(FateInt::from(-1i32).to_usize(), None);
        assert_eq!(FateInt::from(4096u32).to_usize(), Some(4096));
    }

    #[test]
    fn zero_has_one_representation() {
        assert_eq!(FateInt::from_sign_magnitude(true, &[0, 0]), FateInt::zero());
        assert!(!FateInt::from_sign_magnitude(true, &[0]).is_negative());
    }

    #[test]
    fn shifts_by_the_small_int_bias() {
        let value = FateInt::parse_decimal("-1000").unwrap();
        let magnitude = value.magnitude_minus(64).unwrap();
        assert_eq!(
            FateInt::from_magnitude_plus(true, &magnitude, 64).to_string(),
            "-1000"
        );
        assert_eq!(FateInt::from(63u8).magnitude_minus(64), None);
        assert_eq!(FateInt::from(64u8).magnitude_minus(64), Some(Vec::new()));
    }

    #[test]
    fn reports_the_small_int_boundary() {
        assert!(FateInt::from(63i32).abs_below(64));
        assert!(FateInt::from(-63i32).abs_below(64));
        assert!(!FateInt::from(64i32).abs_below(64));
        assert!(!FateInt::from(-64i32).abs_below(64));
    }
}
