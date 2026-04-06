# AI Gravity & Placement Engine

A strategic decision engine for AI workload economics under constraints. 
Developed for [Rack2Cloud.com](https://www.rack2cloud.com).

## 🎯 The Purpose
The **AI Gravity & Placement Engine** moves beyond simple cloud calculators. It models the physical and fiscal "weight" of data (Gravity) against the total cost of ownership (TCO) for high-performance inference.

## 🛠️ The Benchmark: BF16 Integrity
To ensure an honest comparison, all provider data is locked to the following benchmark:
* **Model:** Llama 3 70B
* **Precision:** **BF16 (Full Precision)**
* **VRAM Requirement:** ~145GB (Weight + KV Cache)

*Note: We do not use INT4 or FP8 quantization for this engine, as they produce misleadingly low hardware footprints that don't reflect enterprise-grade reasoning accuracy.*

## 🧬 The Logic: Gravity ($G$)
We measure "Data Gravity" as the ratio of data movement cost (Egress) to monthly compute cost:

$$G = \frac{\text{Dataset Size (GB)} \times \text{Egress Rate}}{\text{Monthly Compute Cost}}$$

- **$G > 0.5$:** Critical Gravity. Data movement costs exceed 50% of compute. Placement is restricted to the data's current location or repatriation.

## ⚙️ Features
- **OpEx Adder Slider:** Adjust for power, cooling, and facility overhead (Default 20%).
- **Duty Cycle Toggle:** Compare 24/7 Steady-State Inference vs. 20% Burst Training.
- **Sovereign Gate:** Hard-filter for regulated industries (excluding specialized providers).

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
