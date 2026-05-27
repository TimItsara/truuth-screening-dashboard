from pathlib import Path


ROOT = Path(__file__).resolve().parent
HTML = ROOT / "index.html"


def main() -> None:
    html = HTML.read_text()
    src_files = [
        ROOT / "src" / "App.tsx",
        ROOT / "src" / "api" / "client.ts",
        ROOT / "src" / "components" / "Sidebar.tsx",
        ROOT / "src" / "components" / "DemoToolbar.tsx",
        ROOT / "src" / "components" / "Views.tsx",
        ROOT / "src" / "components" / "viewTypes.ts",
        ROOT / "src" / "components" / "ResultsList.tsx",
        ROOT / "src" / "components" / "AlertDetail.tsx",
        ROOT / "src" / "components" / "OpsPanel.tsx",
    ]
    source = html + "\n" + "\n".join(path.read_text() for path in src_files)
    required_tokens = [
        'src="/src/main.tsx"',
        "class ApiClient",
        '"/seed"',
        '"/demo/reset?reseed=true"',
        '"/vendors"',
        '"/screening/runs"',
        '`/dashboard/runs/${runId}`',
        '"/vendors/executions"',
        '"/tasks"',
        '`/schedules/${scheduleId}/trigger`',
        '`/webhooks/vendors/${execution.vendor}`',
        '`/results/${resultId}/review`',
        "reviewResult",
        "onReviewResult",
        "Reset Demo",
        "Run Single Test",
        "listVendors",
        "Request verification",
        "activeView",
        "onViewChange",
        "function ActiveView",
        "Subject Management",
        "function ResultsList",
        "function OpsPanel",
    ]
    missing = [token for token in required_tokens if token not in source]
    if missing:
        raise SystemExit(f"Missing UI integration tokens: {missing}")
    print("UI smoke check passed")


if __name__ == "__main__":
    main()
