import providersData from '../data/providers.json';

export interface Provider {
  id: string;
  name: string;
  unit_rate_gpu_hr: number;
  egress_gb: number;
  is_sovereign_eligible: boolean;
  type: 'public' | 'specialized' | 'private';
  footnote: string;
}

export interface EngineInputs {
  datasetSizeGB: number;
  monthlyTokensMillions: number;
  dutyCycle: number;
  opexAdder: number;
  complianceMode: boolean;
  isLegacyFacility: boolean;
  customGpuHr?: number;
  customEgressGb?: number;
}

export interface EngineOutput {
  providerId: string;
  monthlyCompute: number;
  egressTax: number;
  totalMonthlyTCO: number;
  tokenTCO: number;
  gravityScore: number;
  gravityDisplay: string;
  isEligible: boolean;
}

export const calculatePlacement = (inputs: EngineInputs): EngineOutput[] => {
  const { providers } = providersData;
  const HOURS_PER_MONTH = 730;
  const GPUS_IN_CLUSTER = 8;

  // Derive the effective OpEx without mutating the raw input state
  const effectiveOpEx = inputs.isLegacyFacility 
    ? Math.max(inputs.opexAdder, 0.35) 
    : inputs.opexAdder;

  const results: EngineOutput[] = providers.map((provider: any) => {
    
    if (inputs.complianceMode && !provider.is_sovereign_eligible) {
      return {
        providerId: provider.id,
        monthlyCompute: 0,
        egressTax: 0,
        totalMonthlyTCO: 0,
        tokenTCO: 0,
        gravityScore: 0,
        gravityDisplay: "Ineligible",
        isEligible: false,
      };
    }

    let hourlyRatePerGPU = provider.unit_rate_gpu_hr;

    if (provider.type === 'private') {
      const rawAmortized = hourlyRatePerGPU / 1.20;
      hourlyRatePerGPU = rawAmortized * (1 + effectiveOpEx); 
    } else {
      hourlyRatePerGPU = hourlyRatePerGPU * inputs.dutyCycle;
    }

    const monthlyCompute = hourlyRatePerGPU * GPUS_IN_CLUSTER * HOURS_PER_MONTH;
    const egressTax = inputs.datasetSizeGB * provider.egress_gb;
    const totalMonthlyTCO = monthlyCompute + egressTax;

    const tokenTCO = inputs.monthlyTokensMillions > 0 
      ? totalMonthlyTCO / inputs.monthlyTokensMillions 
      : 0;

    const gravityScore = monthlyCompute > 0 ? egressTax / monthlyCompute : 0;
    
    let gravityDisplay = `${(gravityScore * 100).toFixed(1)}%`;
    if (provider.type === 'private') {
      gravityDisplay = "N/A — Co-located";
    } else if (provider.id === 'lambda_h100') {
      gravityDisplay = "0.0%*";
    }

    return {
      providerId: provider.id,
      monthlyCompute,
      egressTax,
      totalMonthlyTCO,
      tokenTCO,
      gravityScore,
      gravityDisplay,
      isEligible: true,
    };
  });

  // Inject Marketplace (BYOR) if user provided an hourly rate
  if (inputs.customGpuHr && inputs.customGpuHr > 0) {
    const customEgressRate = inputs.customEgressGb || 0;
    const monthlyCompute = (inputs.customGpuHr * inputs.dutyCycle) * GPUS_IN_CLUSTER * HOURS_PER_MONTH;
    const egressTax = inputs.datasetSizeGB * customEgressRate;
    const totalMonthlyTCO = monthlyCompute + egressTax;
    const tokenTCO = inputs.monthlyTokensMillions > 0 ? totalMonthlyTCO / inputs.monthlyTokensMillions : 0;
    const gravityScore = monthlyCompute > 0 ? egressTax / monthlyCompute : 0;

    results.push({
      providerId: 'custom_byor',
      monthlyCompute,
      egressTax,
      totalMonthlyTCO,
      tokenTCO,
      gravityScore,
      gravityDisplay: `${(gravityScore * 100).toFixed(1)}%`,
      isEligible: true,
    });
  }

  return results;
};

export const getVerdict = (output: EngineOutput, inputs: EngineInputs) => {
  // Edge Case 1: Misconfiguration Detector
  if (inputs.isLegacyFacility && output.gravityScore < 0.15 && output.providerId !== 'custom_byor') {
    return {
      verdict: "Check Data Placement",
      reasoning: "Low data gravity and legacy facility overhead is an unusual combination. Verify your dataset is genuinely co-located.",
      tip: "If your data is already in S3 or GCS, the gravity score may be understated. Ensure dataset size reflects what must actually move across the wire."
    };
  }

  // Edge Case 2: Sovereign + Legacy
  if (inputs.complianceMode && inputs.isLegacyFacility) {
    return {
      verdict: "Sovereign — Facility Upgrade Required",
      reasoning: "Compliance requires on-prem placement, but your facility efficiency is a cost bottleneck.",
      tip: "Audit your PUE before committing to new CapEx. A 0.5 reduction in PUE is equivalent to a 25% discount on GPU hardware costs. Consider Equinix or Digital Realty colocation to maintain sovereignty while dropping the cooling tax."
    };
  }

  // Scenario 1: Critical Gravity
  if (output.gravityScore > 0.5) {
    return {
      verdict: "Critical Gravity / Stay Put",
      reasoning: `Your Egress Tax ($${output.egressTax.toLocaleString()}) exceeds 50% of your compute cost. The friction of moving this dataset makes external placement irrational.`,
      tip: "Architecturally, you are locked by data volume. Consider repatriation or staying with your current primary data provider to avoid the egress tax."
    };
  }

  // Scenario 2: Steady State
  if (inputs.dutyCycle > 0.7) {
    return {
      verdict: "Steady-State Repatriation",
      reasoning: "High utilization (70%+) favors the fixed-cost CapEx model. Your amortized hardware cost is now significantly lower than cloud rental.",
      tip: "Leverage Nutanix Metro Availability on Cisco UCS to ensure Day 2 operational uptime matches cloud-native SLAs."
    };
  }

  // Scenario 3: Burst/Variable
  return {
    verdict: "Hybrid Burst Eligible",
    reasoning: "Low gravity and variable duty cycle make specialized cloud providers the most efficient choice for high-intensity bursts.",
    tip: inputs.isLegacyFacility 
      ? "Your facility PUE makes burst training to cloud more attractive than it appears. The cooling tax on sustained on-prem GPU load narrows the CapEx advantage — model at 70% duty cycle to find your actual crossover."
      : "Use Infrastructure-as-Code (Terraform/Pulumi) to spin down these GPU clusters immediately after the inference or training batch completes."
  };
};