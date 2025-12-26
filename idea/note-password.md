
# Feature Requirement: Password-Protected Notes with Decoy Passwords (Web)

## 1. Purpose & Goals

The goal of this feature is to protect sensitive notes against **offline brute-force attacks** and **forced disclosure scenarios** by using a **decoy password architecture** and **client-side encryption**.

Key objectives:

* Zero-knowledge: the server must never know user passwords or encryption keys.
* Strong resistance to offline attacks (database leaks).
* Plausible deniability through multiple valid decryptable contents.
* Web-only implementation with acceptable performance and UX.

---

## 2. Core Concept

A single note may contain **multiple encrypted variants**.
Each variant:

* Is encrypted with a **different password**
* Contains **different content**
* Is indistinguishable from others at the storage and protocol level

When a user enters a password, the client attempts to decrypt all variants.
If decryption succeeds for one variant, its content is displayed.

There is **no concept of a “real” or “fake” note** at the system level.

---

## 3. Security Model

### 3.1 Zero-Knowledge Encryption

* Passwords are never sent to the server.
* Encryption and decryption occur **entirely on the client**.
* The server stores only encrypted data and non-secret metadata.

### 3.2 Threats Addressed

* Offline brute-force attacks after database compromise
* Forced password disclosure (plausible deniability)

### 3.3 Threats NOT Addressed

* XSS or malicious browser extensions
* Keyloggers or compromised user devices

---

## 4. Cryptography Requirements

### 4.1 Key Derivation Function (KDF)

* Algorithm: **PBKDF2**
* Hash: SHA-256
* Iterations: **300,000 – 500,000**
* Salt: 16 bytes, randomly generated per variant
* Derived key length: 256 bits

### 4.2 Encryption Algorithm

* Algorithm: **AES-256-GCM**
* IV: 12 bytes, randomly generated per variant
* Authenticated encryption must be used (integrity required)

### 4.3 Validation Method

* Password correctness is validated **implicitly** via successful AES-GCM decryption.
* No password hashes, checksums, or explicit comparisons are allowed.

---

## 5. Data Model

### 5.1 Stored Per Variant

The backend must store the following fields for each variant:

* `encrypted_content`
* `salt`
* `iv`
* `kdf_type` (e.g. pbkdf2)
* `kdf_parameters` (iterations, hash)

### 5.2 Forbidden Storage

The system MUST NOT store:

* Passwords (plaintext or hashed)
* Password verification hashes
* Flags indicating “real” or “decoy” variants
* Variant priority or hierarchy

---

## 6. Unlock Flow (Client-Side)

1. Client fetches all encrypted variants of a note.
2. User enters a password.
3. Client randomly shuffles the variant list.
4. For each variant:

   * Derive a key using PBKDF2(password, salt, iterations).
   * Attempt AES-GCM decryption.
5. On first successful decryption:

   * Display decrypted content.
   * Stop further attempts.
6. If all attempts fail:

   * Display a generic “Unable to unlock content” message.

The client must not reveal:

* How many variants exist
* Whether a password is “close” to correct

---

## 7. Performance Requirements

* Maximum number of variants per note: **3–5**
* Expected unlock time per PBKDF2 operation: ~100–200 ms (desktop browsers)
* Total unlock time should not exceed ~500 ms for typical use
* Cryptographic operations SHOULD run in a Web Worker to avoid UI blocking

---

## 8. Side-Channel Considerations

* Variant order must be randomized on each unlock attempt.
* The system should avoid observable differences between “wrong password” and “wrong variant”.
* Early-exit on successful decryption is acceptable for UX; full constant-time execution is optional.

---

## 9. Memory & Data Handling

* Decrypted plaintext must exist only in memory.
* Plaintext and derived keys must be cleared when:

  * The note is locked
  * The tab loses focus
  * The page is refreshed or closed
* Plaintext must never be logged or persisted.

---

## 10. UX & Messaging Constraints

* The UI must not label any content as “fake” or “decoy”.
* Error messages must be generic and non-revealing.
* Users may create multiple contents intentionally, each with its own password.

---

## 11. Non-Goals

* Password recovery is not supported.
* Server-side password validation is not supported.
* Multi-layer or sequential password unlocking is explicitly excluded.

---

## 12. Summary (Design Rationale)

* PBKDF2 slows down brute-force attacks economically.
* AES-GCM provides authenticated decryption without explicit password comparison.
* Decoy variants remove the attacker’s ability to know when decryption is complete.
* Security is achieved through **cryptographic uncertainty**, not secrecy of code.

