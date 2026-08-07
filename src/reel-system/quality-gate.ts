export type QualityGateInput = {
  storyboardValid: boolean;
  layoutValid: boolean;
  collisionValid: boolean;
  safeZoneValid: boolean;
  noveltyValid: boolean;
  heroClarityValid: boolean;
  sceneComplexityValid?: boolean;
  audioValid: boolean;
};

export type QualityGateResult = {
  valid: boolean;
  failures: Array<keyof QualityGateInput>;
};

export const evaluateQualityGate = (input: QualityGateInput): QualityGateResult => {
  const failures = (Object.keys(input) as Array<keyof QualityGateInput>).filter((key) => input[key] !== true);
  return {valid: failures.length === 0, failures};
};
