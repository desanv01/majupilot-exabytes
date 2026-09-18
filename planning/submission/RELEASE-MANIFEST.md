# Release manifest contract

Run from `sme-growth-twin/`:

```powershell
npm run release:manifest
```

The deterministic script emits a JSON manifest to the operating-system temporary directory by default, so it does not dirty the repository. Set `STAGE07_MANIFEST_PATH` to retain an explicit reviewed path. It records the current commit/branch, Node/npm versions, frozen fixture/catalogue/rule/model versions, `git diff --check`, SHA-256 hashes of the release-defining files and test evidence, deployment URL/target/status when supplied, and pending manual gates.

Current software versions: fixture, catalogue, score, pain, recommendation, scenario, ROI, advisor, and Blueprint model `1.0.0`. Deployment URL/target/status remain pending external action. The authoritative command results are in the hashed `TEST-EVIDENCE.md`; the manifest does not fabricate results or external readiness.
