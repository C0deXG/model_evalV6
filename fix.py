import json, re

input_file = "evaluation_results_all.json"
output_file = "evaluation_results_clean.json"

with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

# Rebuild clean results
clean = {
    "model_checkpoint": data.get("model_checkpoint"),
    "base_model": data.get("base_model"),
    "total_samples_in_dataset": data.get("total_samples_in_dataset"),
    "samples_evaluated": data.get("samples_evaluated"),
    "samples_skipped": data.get("samples_skipped"),
    "overall_wer": data.get("overall_wer"),
    "overall_wer_percent": data.get("overall_wer_percent"),
    "results": []
}

for r in data.get("results", []):
    pred = r.get("prediction", "")
    m = re.search(r"text='(.*?)'", pred)
    clean_text = m.group(1) if m else ""
    clean["results"].append({
        "path": r.get("path", ""),
        "ground_truth": r.get("ground_truth", ""),
        "prediction": clean_text
    })

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(clean, f, ensure_ascii=False, indent=2)

print(f"Cleaned JSON written to {output_file}")
