"""
Console Diagnostics and Performance Monitoring
Tools for analyzing browser console output and performance metrics
"""

import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from collections import defaultdict


class ConsoleDiagnostics:
    """
    Analyze and categorize browser console logs
    """

    def __init__(self):
        self.logs: List[str] = []
        self.categories = {
            "errors": [],
            "warnings": [],
            "info": [],
            "debug": [],
            "network": [],
            "other": []
        }

    def add_log(self, log: str):
        """Add a log entry and categorize it"""
        self.logs.append(log)
        self._categorize_log(log)

    def add_logs(self, logs: List[str]):
        """Add multiple log entries"""
        for log in logs:
            self.add_log(log)

    def _categorize_log(self, log: str):
        """Categorize a log entry"""
        log_lower = log.lower()

        if "[error]" in log_lower or "[page_error]" in log_lower:
            self.categories["errors"].append(log)
        elif "[warning]" in log_lower or "[warn]" in log_lower:
            self.categories["warnings"].append(log)
        elif "[info]" in log_lower or "[log]" in log_lower:
            self.categories["info"].append(log)
        elif "[debug]" in log_lower:
            self.categories["debug"].append(log)
        elif "network" in log_lower or "fetch" in log_lower or "xhr" in log_lower:
            self.categories["network"].append(log)
        else:
            self.categories["other"].append(log)

    def get_errors(self) -> List[str]:
        """Get all error logs"""
        return self.categories["errors"]

    def get_warnings(self) -> List[str]:
        """Get all warning logs"""
        return self.categories["warnings"]

    def get_network_logs(self) -> List[str]:
        """Get all network-related logs"""
        return self.categories["network"]

    def has_errors(self) -> bool:
        """Check if there are any errors"""
        return len(self.categories["errors"]) > 0

    def has_warnings(self) -> bool:
        """Check if there are any warnings"""
        return len(self.categories["warnings"]) > 0

    def get_summary(self) -> Dict[str, int]:
        """Get a summary of log counts by category"""
        return {
            category: len(logs)
            for category, logs in self.categories.items()
        }

    def search_logs(self, pattern: str, case_sensitive: bool = False) -> List[str]:
        """
        Search logs for a pattern

        Args:
            pattern: Regex pattern to search for
            case_sensitive: Whether search is case sensitive

        Returns:
            List of matching log entries
        """
        flags = 0 if case_sensitive else re.IGNORECASE
        regex = re.compile(pattern, flags)

        return [log for log in self.logs if regex.search(log)]

    def filter_by_category(self, category: str) -> List[str]:
        """Get logs from a specific category"""
        return self.categories.get(category, [])

    def generate_report(self) -> str:
        """Generate a formatted diagnostic report"""
        report_lines = [
            "=" * 60,
            "Console Diagnostics Report",
            "=" * 60,
            f"Total Logs: {len(self.logs)}",
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "Summary by Category:",
            "-" * 60
        ]

        summary = self.get_summary()
        for category, count in summary.items():
            report_lines.append(f"  {category.capitalize()}: {count}")

        if self.has_errors():
            report_lines.extend([
                "",
                "Errors:",
                "-" * 60
            ])
            for i, error in enumerate(self.get_errors()[:10], 1):
                report_lines.append(f"  {i}. {error[:100]}")
            if len(self.get_errors()) > 10:
                report_lines.append(f"  ... and {len(self.get_errors()) - 10} more")

        if self.has_warnings():
            report_lines.extend([
                "",
                "Warnings:",
                "-" * 60
            ])
            for i, warning in enumerate(self.get_warnings()[:5], 1):
                report_lines.append(f"  {i}. {warning[:100]}")
            if len(self.get_warnings()) > 5:
                report_lines.append(f"  ... and {len(self.get_warnings()) - 5} more")

        report_lines.append("=" * 60)
        return "\n".join(report_lines)

    def clear(self):
        """Clear all logs"""
        self.logs.clear()
        for category in self.categories.values():
            category.clear()


class PerformanceMonitor:
    """
    Monitor and analyze browser performance metrics
    """

    def __init__(self):
        self.metrics: Dict[str, List[float]] = defaultdict(list)
        self.timestamps: Dict[str, List[str]] = defaultdict(list)

    def record_metric(self, name: str, value: float):
        """
        Record a performance metric

        Args:
            name: Metric name
            value: Metric value
        """
        self.metrics[name].append(value)
        self.timestamps[name].append(datetime.now().isoformat())

    def get_metric(self, name: str) -> List[float]:
        """Get all values for a metric"""
        return self.metrics.get(name, [])

    def get_average(self, name: str) -> Optional[float]:
        """Get average value for a metric"""
        values = self.get_metric(name)
        return sum(values) / len(values) if values else None

    def get_min(self, name: str) -> Optional[float]:
        """Get minimum value for a metric"""
        values = self.get_metric(name)
        return min(values) if values else None

    def get_max(self, name: str) -> Optional[float]:
        """Get maximum value for a metric"""
        values = self.get_metric(name)
        return max(values) if values else None

    def get_latest(self, name: str) -> Optional[float]:
        """Get latest value for a metric"""
        values = self.get_metric(name)
        return values[-1] if values else None

    def get_summary(self) -> Dict[str, Dict[str, Any]]:
        """Get summary statistics for all metrics"""
        summary = {}

        for name, values in self.metrics.items():
            if values:
                summary[name] = {
                    "count": len(values),
                    "average": sum(values) / len(values),
                    "min": min(values),
                    "max": max(values),
                    "latest": values[-1]
                }

        return summary

    def generate_report(self) -> str:
        """Generate a formatted performance report"""
        report_lines = [
            "=" * 60,
            "Performance Monitoring Report",
            "=" * 60,
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            ""
        ]

        summary = self.get_summary()

        if not summary:
            report_lines.append("No performance metrics recorded.")
        else:
            report_lines.append("Metrics Summary:")
            report_lines.append("-" * 60)

            for name, stats in summary.items():
                report_lines.extend([
                    f"\n{name}:",
                    f"  Count: {stats['count']}",
                    f"  Average: {stats['average']:.2f}",
                    f"  Min: {stats['min']:.2f}",
                    f"  Max: {stats['max']:.2f}",
                    f"  Latest: {stats['latest']:.2f}"
                ])

        report_lines.append("\n" + "=" * 60)
        return "\n".join(report_lines)

    def clear(self, metric_name: Optional[str] = None):
        """
        Clear metrics

        Args:
            metric_name: Specific metric to clear, or None to clear all
        """
        if metric_name:
            if metric_name in self.metrics:
                self.metrics[metric_name].clear()
                self.timestamps[metric_name].clear()
        else:
            self.metrics.clear()
            self.timestamps.clear()


class TestReporter:
    """
    Generate test reports from browser automation sessions
    """

    def __init__(self):
        self.test_results: List[Dict[str, Any]] = []
        self.session_start = datetime.now()

    def add_test_result(self,
                       test_name: str,
                       status: str,
                       duration: float,
                       details: Optional[Dict[str, Any]] = None):
        """
        Add a test result

        Args:
            test_name: Name of the test
            status: Test status (passed, failed, skipped)
            duration: Test duration in seconds
            details: Optional additional details
        """
        result = {
            "name": test_name,
            "status": status,
            "duration": duration,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)

    def get_summary(self) -> Dict[str, Any]:
        """Get test execution summary"""
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r["status"] == "passed")
        failed = sum(1 for r in self.test_results if r["status"] == "failed")
        skipped = sum(1 for r in self.test_results if r["status"] == "skipped")

        total_duration = sum(r["duration"] for r in self.test_results)

        return {
            "total": total,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "duration": total_duration,
            "session_duration": (datetime.now() - self.session_start).total_seconds()
        }

    def generate_report(self) -> str:
        """Generate formatted test report"""
        summary = self.get_summary()

        report_lines = [
            "=" * 60,
            "Test Execution Report",
            "=" * 60,
            f"Session Start: {self.session_start.strftime('%Y-%m-%d %H:%M:%S')}",
            f"Total Duration: {summary['session_duration']:.2f}s",
            "",
            "Summary:",
            "-" * 60,
            f"  Total Tests: {summary['total']}",
            f"  Passed: {summary['passed']} ✓",
            f"  Failed: {summary['failed']} ✗",
            f"  Skipped: {summary['skipped']} -",
            f"  Test Duration: {summary['duration']:.2f}s",
            ""
        ]

        if self.test_results:
            report_lines.append("Test Results:")
            report_lines.append("-" * 60)

            for result in self.test_results:
                status_icon = "✓" if result["status"] == "passed" else "✗" if result["status"] == "failed" else "-"
                report_lines.append(
                    f"  {status_icon} {result['name']} ({result['duration']:.2f}s)"
                )

        report_lines.append("=" * 60)
        return "\n".join(report_lines)

    def save_report(self, filename: str):
        """Save report to file"""
        report = self.generate_report()
        with open(filename, 'w') as f:
            f.write(report)

    def clear(self):
        """Clear all test results"""
        self.test_results.clear()
        self.session_start = datetime.now()
