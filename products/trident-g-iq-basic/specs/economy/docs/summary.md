**Credit assignment rules (current implementation, based on spec language):**
1. **Consistency gate:** Any award requires last‑3‑block consistency (average accuracy ≥ 85%). This is the “stability gate” from the telemetry spec.  
2. **Session quality bucket (max 2,000 Tridents):**
   - **Good session:** +40 Tridents when block accuracy ≥ 90% and consistency gate passes.  
   - **Fast finish:** +20 Tridents when speed = fast and accuracy ≥ 85% and consistency gate passes.  
   - **New best average:** +40 Tridents when a 10‑block session average beats prior best by >1% and consistency gate passes at that point.  
   - **New best stable level:** +40 Tridents when stable level (last‑3 average n) exceeds prior best.
3. **Portability & mastery bucket (max 4,500 Tridents):**
   - **Swap hold:** +100 Tridents when wrapper changes and performance holds (accuracy ≥ 85% and n does not drop more than 1) with consistency gate.  
   - **Variant fast 3 mastered:** +200 Tridents the first time a wrapper+target variant hits stable 3‑back at fast speed with accuracy ≥ 90% and consistency gate.  
   - **Family fast 3 mastered:** +600 Tridents once all 3 wrappers have fast‑3 mastery with consistency gate.
4. **Transfer readiness bucket (max 1,500 Tridents):**
   - **Emerging:** +150 Tridents the first time a swap hold happens.  
   - **Developing:** +300 Tridents the first time a fast finish happens.  
   - **Broadening:** +450 Tridents the first time a variant fast‑3 mastery happens.  
   - **Strong:** +600 Tridents the first time a family fast‑3 mastery happens.
5. **Challenge bonus (max 2,000 Tridents):**
   - **20‑session challenge completion:** +2,000 Tridents if all 9 variants reach fast stable 3‑back within 20 sessions; also triggers a coaching voucher event (0 Tridents).

  
