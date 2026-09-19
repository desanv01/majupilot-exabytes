import { describe,expect,it } from "vitest";
import { artifactWriteSchema,assessmentAnswerRecordSchema,consentAppendSchema,dataRequestSchema,PersistenceError } from "@/domain/persistence";
const u=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
describe("Phase B persistence contracts",()=>{
  it("accepts strict typed answer and rejects unknown fields",()=>{const value={id:u(1),assessmentSessionId:u(2),answerKey:"q1",revision:1,value:{industry:"retail"},evidenceState:"confirmed",schemaVersion:"1.0.0"};expect(assessmentAnswerRecordSchema.parse(value)).toEqual(value);expect(()=>assessmentAnswerRecordSchema.parse({...value,organizationId:u(3)})).toThrow();});
  it("requires one export/deletion scope",()=>{expect(dataRequestSchema.safeParse({id:u(1),organizationId:u(2),retentionPolicyVersion:"2026-09"}).success).toBe(true);expect(dataRequestSchema.safeParse({id:u(1),organizationId:u(2),assessmentSessionId:u(3),retentionPolicyVersion:"2026-09"}).success).toBe(false);});
  it("keeps consent append-only semantics explicit",()=>{const c=consentAppendSchema.parse({id:u(1),assessmentSessionId:u(2),purpose:"consultation_contact",action:"withdrawn",consentVersion:"2",policyVersion:"1",textHash:"a".repeat(64),locale:"en-MY",presentationSurface:"assessment",parentConsentId:u(3),requestId:"request-0001",channel:"web"});expect(c.action).toBe("withdrawn");expect(c.parentConsentId).toBe(u(3));});
  it("requires artifact provenance fields",()=>{expect(artifactWriteSchema.safeParse({kind:"business_twins",id:u(1),assessmentSessionId:u(2),payload:{},revision:1,schemaVersion:"1",rulePackVersion:"1",sourceArtifactIds:[],links:{}}).success).toBe(true);});
  it("exposes only stable safe error codes",()=>{const error=new PersistenceError("CLAIM_CONFLICT",409);expect(error.message).toBe("CLAIM_CONFLICT");expect(error.httpStatus).toBe(409);});
});
