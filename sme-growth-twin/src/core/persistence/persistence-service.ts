import { artifactWriteSchema, assessmentAnswerRecordSchema, consentAppendSchema, dataRequestSchema, type ArtifactWrite, type AssessmentAnswerRecord, type ConsentAppend, type DataRequest, type OwnershipContext } from "@/domain/persistence";

export interface PersistenceServicePort {
  saveAnswer(owner:OwnershipContext,record:AssessmentAnswerRecord):Promise<void>;
  saveArtifact(owner:OwnershipContext,record:ArtifactWrite):Promise<void>;
  appendConsent(owner:OwnershipContext,record:ConsentAppend):Promise<void>;
  createExport(owner:OwnershipContext,request:DataRequest):Promise<string>;
  createDeletion(owner:OwnershipContext,request:DataRequest):Promise<string>;
}

export class PersistenceService {
  constructor(private readonly repository:PersistenceServicePort){}
  saveAnswer(owner:OwnershipContext,input:unknown){return this.repository.saveAnswer(owner,assessmentAnswerRecordSchema.parse(input));}
  saveArtifact(owner:OwnershipContext,input:unknown){return this.repository.saveArtifact(owner,artifactWriteSchema.parse(input));}
  appendConsent(owner:OwnershipContext,input:unknown){return this.repository.appendConsent(owner,consentAppendSchema.parse(input));}
  requestExport(owner:OwnershipContext,input:unknown){return this.repository.createExport(owner,dataRequestSchema.parse(input));}
  requestDeletion(owner:OwnershipContext,input:unknown){return this.repository.createDeletion(owner,dataRequestSchema.parse(input));}
}
