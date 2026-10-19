# Security Specification: EduHomework Firestore Security Rules

## 1. Data Invariants
1. `users`: Every user document ID must match the schema and can only be managed by authenticated users with appropriate roles (admin/teachers/self).
2. `assignments`: Created by teachers or admin. Read access available to all school users to complete assignments.
3. `submissions`: Created by students (or teachers testing). Students can only submit for their student ID. Teachers and admins can review and update scores and feedback.
4. Catch-all: Any undefined collection or path defaults to `allow read, write: if false;`.

## 2. Dirty Dozen Payloads (Rejection Matrix)
1. **Ghost Field in User**: Payload has `{ id, username, fullName, role, ghostKey: "evil" }` -> REJECTED (anti-shadow-field).
2. **Invalid User Role**: Role set to `"super_hacker"` -> REJECTED.
3. **Huge String in Username**: 2000 chars username -> REJECTED.
4. **Huge String in Assignment Title**: 10000 chars title -> REJECTED.
5. **Negative Points in Assignment**: totalPoints < 0 -> REJECTED.
6. **Student Modifying Others Submission**: Non-owner student updating another student's submission -> REJECTED.
7. **Negative Scores in Submission**: totalScore < 0 -> REJECTED.
8. **Invalid Status in Submission**: status = "cheating" -> REJECTED.
9. **Junk ID Poisoning**: Document path `/users/!!--&&` with junk chars -> REJECTED.
10. **Tampering with immutable assignment ID**: Updating assignment and changing its ID -> REJECTED.
11. **Client Delegation without resource check**: Querying without rule-side validation -> REJECTED.
12. **PII Blanket Read**: Arbitrary anonymous reading all users without verification -> REJECTED.
