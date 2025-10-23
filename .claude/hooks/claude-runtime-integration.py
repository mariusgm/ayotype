#!/usr/bin/env python3
"""
🤖 Claude Agent Runtime Integration for Persistent Diagnostics
============================================================
Integrates Claude AI with browser automation for intelligent testing,
session persistence, and comprehensive quality assurance.
"""

import asyncio
import json
import os
import sys
import time
import yaml
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import hashlib
import pickle

# Colors
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
CYAN = '\033[0;36m'
MAGENTA = '\033[0;35m'
NC = '\033[0m'

class SessionPersistence:
    """Manages session data persistence across runs"""
    
    def __init__(self, session_dir: str = ".claude/sessions"):
        self.session_dir = Path(session_dir)
        self.session_dir.mkdir(parents=True, exist_ok=True)
        self.session_file = self.session_dir / "diagnostics_session.pkl"
        self.session_data = self.load_session()
        
    def load_session(self) -> Dict[str, Any]:
        """Load existing session data"""
        if self.session_file.exists():
            try:
                with open(self.session_file, 'rb') as f:
                    return pickle.load(f)
            except:
                pass
        return {
            'baseline_metrics': {},
            'historical_issues': [],
            'performance_history': [],
            'test_patterns': [],
            'user_preferences': {},
            'security_baseline': {},
            'last_run_hash': '',
            'session_count': 0,
            'total_runtime': 0.0
        }
        
    def save_session(self):
        """Save current session data"""
        try:
            with open(self.session_file, 'wb') as f:
                pickle.dump(self.session_data, f)
        except Exception as e:
            print(f"{YELLOW}Warning: Could not save session data: {e}{NC}")
            
    def update_baseline_metrics(self, metrics: Dict[str, Any]):
        """Update baseline performance metrics"""
        if 'performance' not in self.session_data['baseline_metrics']:
            self.session_data['baseline_metrics']['performance'] = metrics
        else:
            # Update with improved metrics only
            baseline = self.session_data['baseline_metrics']['performance']
            for key, value in metrics.items():
                if isinstance(value, (int, float)):
                    if key not in baseline or value < baseline[key]:
                        baseline[key] = value
                        
    def add_performance_datapoint(self, metrics: Dict[str, Any]):
        """Add performance data point to history"""
        datapoint = {
            'timestamp': datetime.now().isoformat(),
            'metrics': metrics
        }
        self.session_data['performance_history'].append(datapoint)
        
        # Keep only last 50 datapoints
        if len(self.session_data['performance_history']) > 50:
            self.session_data['performance_history'] = self.session_data['performance_history'][-50:]
            
    def get_performance_trends(self) -> Dict[str, str]:
        """Analyze performance trends"""
        if len(self.session_data['performance_history']) < 2:
            return {}
            
        recent = self.session_data['performance_history'][-5:]
        older = self.session_data['performance_history'][-10:-5] if len(self.session_data['performance_history']) >= 10 else []
        
        trends = {}
        if older:
            for metric in ['page_load_time', 'first_contentful_paint', 'memory_usage']:
                recent_avg = sum(p['metrics'].get(metric, 0) for p in recent) / len(recent)
                older_avg = sum(p['metrics'].get(metric, 0) for p in older) / len(older)
                
                if recent_avg < older_avg * 0.9:
                    trends[metric] = 'improving'
                elif recent_avg > older_avg * 1.1:
                    trends[metric] = 'degrading'
                else:
                    trends[metric] = 'stable'
                    
        return trends
        
    def track_issue(self, issue: str, category: str):
        """Track recurring issues"""
        issue_hash = hashlib.md5(issue.encode()).hexdigest()
        issue_data = {
            'hash': issue_hash,
            'issue': issue,
            'category': category,
            'first_seen': datetime.now().isoformat(),
            'count': 1,
            'last_seen': datetime.now().isoformat()
        }
        
        # Check if issue already exists
        for existing in self.session_data['historical_issues']:
            if existing['hash'] == issue_hash:
                existing['count'] += 1
                existing['last_seen'] = datetime.now().isoformat()
                return
                
        self.session_data['historical_issues'].append(issue_data)
        
    def get_recurring_issues(self, min_count: int = 3) -> List[Dict[str, Any]]:
        """Get issues that occur frequently"""
        return [issue for issue in self.session_data['historical_issues'] 
                if issue['count'] >= min_count]

class ClaudeRuntimeIntegration:
    """Integrates Claude Agent Runtime with diagnostics"""
    
    def __init__(self, config_path: str = "claude-agent-runtime/configs/emojifusion.yml"):
        self.config_path = config_path
        self.config = self.load_config()
        self.session = SessionPersistence()
        self.runtime_dir = Path("claude-agent-runtime")
        
    def load_config(self) -> Dict[str, Any]:
        """Load Claude Agent Runtime configuration"""
        try:
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"{RED}Error loading config: {e}{NC}")
            return {}
            
    def get_project_hash(self) -> str:
        """Generate hash of project state for change detection"""
        import subprocess
        try:
            # Get git hash and list of modified files
            git_hash = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
            git_status = subprocess.check_output(['git', 'status', '--porcelain'], text=True)
            
            # Include key files content
            key_files = ['package.json', 'src/App.tsx', 'api/generate.ts']
            file_contents = []
            
            for file_path in key_files:
                if os.path.exists(file_path):
                    with open(file_path, 'r') as f:
                        file_contents.append(f.read())
                        
            combined = f"{git_hash}{git_status}{''.join(file_contents)}"
            return hashlib.md5(combined.encode()).hexdigest()
            
        except:
            # Fallback to timestamp if git not available
            return str(int(time.time() / 3600))  # Changes every hour
            
    def should_run_full_diagnostics(self) -> bool:
        """Determine if full diagnostics should run"""
        current_hash = self.get_project_hash()
        last_hash = self.session.session_data.get('last_run_hash', '')
        
        if current_hash != last_hash:
            print(f"{CYAN}🔄 Project changes detected - running full diagnostics{NC}")
            return True
            
        # Run full diagnostics every 10th session
        session_count = self.session.session_data.get('session_count', 0)
        if session_count % 10 == 0:
            print(f"{CYAN}🔄 Periodic full diagnostics (session #{session_count}){NC}")
            return True
            
        print(f"{GREEN}✓ No changes detected - running quick validation{NC}")
        return False
        
    async def run_intelligent_diagnostics(self) -> Dict[str, Any]:
        """Run AI-powered intelligent diagnostics"""
        start_time = time.time()
        
        # Update session tracking
        self.session.session_data['session_count'] += 1
        current_hash = self.get_project_hash()
        
        print(f"\n{MAGENTA}🤖 CLAUDE AGENT RUNTIME DIAGNOSTICS{NC}")
        print("=" * 50)
        print(f"Session #{self.session.session_data['session_count']}")
        print(f"Project Hash: {current_hash[:8]}...")
        
        results = {
            'session_info': {
                'session_count': self.session.session_data['session_count'],
                'project_hash': current_hash,
                'timestamp': datetime.now().isoformat()
            },
            'quick_validation': {},
            'full_diagnostics': {},
            'performance_analysis': {},
            'issue_tracking': {},
            'recommendations': []
        }
        
        # Quick validation (always runs)
        print(f"\n{BLUE}🚀 Running quick validation...{NC}")
        quick_results = await self.run_quick_validation()
        results['quick_validation'] = quick_results
        
        # Determine if full diagnostics needed
        needs_full_scan = self.should_run_full_diagnostics()
        
        if needs_full_scan or not quick_results.get('passed', False):
            print(f"\n{BLUE}🔬 Running comprehensive diagnostics...{NC}")
            full_results = await self.run_full_diagnostics()
            results['full_diagnostics'] = full_results
            
            # Update session data
            self.session.session_data['last_run_hash'] = current_hash
        else:
            print(f"{GREEN}✓ Skipping full diagnostics - quick validation passed{NC}")
            
        # Performance analysis
        print(f"\n{BLUE}📊 Analyzing performance trends...{NC}")
        perf_analysis = self.analyze_performance_trends()
        results['performance_analysis'] = perf_analysis
        
        # Issue tracking
        print(f"\n{BLUE}🔍 Analyzing issue patterns...{NC}")
        issue_analysis = self.analyze_issue_patterns()
        results['issue_tracking'] = issue_analysis
        
        # Generate AI recommendations
        print(f"\n{BLUE}💡 Generating intelligent recommendations...{NC}")
        recommendations = self.generate_ai_recommendations(results)
        results['recommendations'] = recommendations
        
        # Update runtime tracking
        runtime = time.time() - start_time
        self.session.session_data['total_runtime'] += runtime
        results['runtime'] = runtime
        
        # Save session
        self.session.save_session()
        
        return results
        
    async def run_quick_validation(self) -> Dict[str, Any]:
        """Run quick validation checks"""
        import aiohttp
        
        results = {
            'passed': False,
            'checks': {},
            'errors': [],
            'response_times': {}
        }
        
        try:
            # Check if server is running
            async with aiohttp.ClientSession() as session:
                start = time.time()
                async with session.get("http://127.0.0.1:3000", timeout=aiohttp.ClientTimeout(total=5)) as response:
                    results['response_times']['main_page'] = time.time() - start
                    results['checks']['server_running'] = response.status == 200
                    
                # Quick API test
                start = time.time()
                async with session.post("http://127.0.0.1:3000/api/generate", 
                                      json={"words": "test", "mode": "emoji", "tone": "fun"},
                                      timeout=aiohttp.ClientTimeout(total=10)) as response:
                    results['response_times']['api_endpoint'] = time.time() - start
                    results['checks']['api_responding'] = response.status in [200, 400, 429]
                    
            # Overall validation
            results['passed'] = all(results['checks'].values())
            
        except Exception as e:
            results['errors'].append(f"Quick validation failed: {str(e)}")
            
        return results
        
    async def run_full_diagnostics(self) -> Dict[str, Any]:
        """Run comprehensive diagnostics using browser automation"""
        try:
            # Import and run browser diagnostics
            sys.path.insert(0, '.claude/hooks')
            from browser_diagnostics import BrowserDiagnostics
            
            async with BrowserDiagnostics() as diagnostics:
                report = await diagnostics.run_diagnostics("/")
                
                # Convert to dict format
                results = {
                    'passed': report.passed,
                    'console_errors': len([log for log in report.console_logs if log.type == "error"]),
                    'console_warnings': len([log for log in report.console_logs if log.type == "warning"]),
                    'network_failures': len([r for r in report.network_requests if r.failed]),
                    'security_issues': len(report.security_issues),
                    'performance_metrics': report.performance.__dict__ if report.performance else {},
                    'screenshots': report.screenshots
                }
                
                # Track issues in session
                for error in report.errors:
                    self.session.track_issue(error, 'error')
                for issue in report.security_issues:
                    self.session.track_issue(issue, 'security')
                    
                # Update performance history
                if report.performance:
                    perf_dict = report.performance.__dict__
                    self.session.add_performance_datapoint(perf_dict)
                    self.session.update_baseline_metrics(perf_dict)
                    
                return results
                
        except Exception as e:
            return {
                'passed': False,
                'error': str(e),
                'fallback_used': True
            }
            
    def analyze_performance_trends(self) -> Dict[str, Any]:
        """Analyze performance trends from session data"""
        trends = self.session.get_performance_trends()
        baseline = self.session.session_data.get('baseline_metrics', {}).get('performance', {})
        
        return {
            'trends': trends,
            'baseline_metrics': baseline,
            'data_points': len(self.session.session_data.get('performance_history', [])),
            'analysis': self.interpret_trends(trends)
        }
        
    def interpret_trends(self, trends: Dict[str, str]) -> List[str]:
        """Interpret performance trends into actionable insights"""
        insights = []
        
        for metric, trend in trends.items():
            if trend == 'degrading':
                insights.append(f"⚠️  {metric} is degrading - investigate recent changes")
            elif trend == 'improving':
                insights.append(f"✅ {metric} is improving - good optimization")
            else:
                insights.append(f"📊 {metric} is stable")
                
        return insights
        
    def analyze_issue_patterns(self) -> Dict[str, Any]:
        """Analyze patterns in historical issues"""
        recurring = self.session.get_recurring_issues()
        
        # Categorize issues
        categories = {}
        for issue in recurring:
            cat = issue['category']
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(issue)
            
        return {
            'recurring_issues': recurring,
            'issue_categories': categories,
            'total_tracked': len(self.session.session_data.get('historical_issues', [])),
            'recommendations': self.generate_issue_recommendations(recurring)
        }
        
    def generate_issue_recommendations(self, recurring_issues: List[Dict]) -> List[str]:
        """Generate recommendations based on recurring issues"""
        recommendations = []
        
        for issue in recurring_issues:
            count = issue['count']
            category = issue['category']
            issue_text = issue['issue']
            
            if count >= 5:
                recommendations.append(f"🔥 URGENT: '{issue_text}' has occurred {count} times - needs immediate attention")
            elif 'security' in category.lower():
                recommendations.append(f"🔒 Security issue recurring: {issue_text}")
            elif 'performance' in issue_text.lower():
                recommendations.append(f"⚡ Performance issue: {issue_text}")
            else:
                recommendations.append(f"🔧 Recurring issue: {issue_text} (×{count})")
                
        return recommendations
        
    def generate_ai_recommendations(self, results: Dict[str, Any]) -> List[str]:
        """Generate AI-powered recommendations based on all diagnostic data"""
        recommendations = []
        
        # Quick validation insights
        quick = results.get('quick_validation', {})
        if not quick.get('passed', False):
            recommendations.append("🚨 CRITICAL: Quick validation failed - fix immediately")
            
        # Response time analysis
        response_times = quick.get('response_times', {})
        for endpoint, time_ms in response_times.items():
            if time_ms > 2.0:
                recommendations.append(f"⚡ Optimize {endpoint} - response time {time_ms:.2f}s is slow")
                
        # Full diagnostics insights
        full = results.get('full_diagnostics', {})
        if full.get('security_issues', 0) > 0:
            recommendations.append("🔒 Security issues detected - review and fix before deployment")
            
        if full.get('console_errors', 0) > 0:
            recommendations.append("🐛 Console errors found - check browser console")
            
        # Performance trends
        perf = results.get('performance_analysis', {})
        for insight in perf.get('analysis', []):
            if '⚠️' in insight:
                recommendations.append(f"📊 {insight}")
                
        # Issue patterns
        issues = results.get('issue_tracking', {})
        for rec in issues.get('recommendations', []):
            recommendations.append(rec)
            
        # Session-based recommendations
        session_count = self.session.session_data.get('session_count', 0)
        if session_count > 20:
            recommendations.append("📈 Consider implementing automated monitoring - you've run many diagnostic sessions")
            
        # Default recommendations if none found
        if not recommendations:
            recommendations.extend([
                "✅ All diagnostics passed - system is healthy",
                "💡 Consider adding more comprehensive tests",
                "📊 Monitor performance metrics regularly"
            ])
            
        return recommendations
        
    def print_results(self, results: Dict[str, Any]):
        """Print formatted results"""
        print(f"\n{CYAN}📊 CLAUDE RUNTIME DIAGNOSTICS SUMMARY{NC}")
        print("=" * 60)
        
        # Session info
        session_info = results['session_info']
        print(f"Session: #{session_info['session_count']}")
        print(f"Runtime: {results.get('runtime', 0):.2f}s")
        
        # Quick validation
        quick = results['quick_validation']
        status = "PASSED" if quick.get('passed', False) else "FAILED"
        color = GREEN if quick.get('passed', False) else RED
        print(f"\nQuick Validation: {color}{status}{NC}")
        
        # Performance trends
        perf = results['performance_analysis']
        if perf.get('trends'):
            print(f"\n{MAGENTA}Performance Trends:{NC}")
            for insight in perf.get('analysis', []):
                print(f"  {insight}")
                
        # Issue patterns
        issues = results['issue_tracking']
        recurring_count = len(issues.get('recurring_issues', []))
        if recurring_count > 0:
            print(f"\n{YELLOW}Recurring Issues: {recurring_count}{NC}")
            
        # Recommendations
        recommendations = results['recommendations']
        if recommendations:
            print(f"\n{CYAN}💡 AI Recommendations:{NC}")
            for i, rec in enumerate(recommendations[:10], 1):  # Show top 10
                print(f"  {i}. {rec}")
                
        # Overall status
        overall_passed = (quick.get('passed', False) and 
                         results.get('full_diagnostics', {}).get('passed', True))
        
        if overall_passed:
            print(f"\n{GREEN}🎉 OVERALL STATUS: PASSED{NC}")
        else:
            print(f"\n{RED}⚠️  OVERALL STATUS: NEEDS ATTENTION{NC}")
            
        print(f"\n{BLUE}Session data saved for future runs{NC}")

async def main():
    """Main entry point"""
    integration = ClaudeRuntimeIntegration()
    
    try:
        results = await integration.run_intelligent_diagnostics()
        integration.print_results(results)
        
        # Save detailed report
        report_dir = Path("diagnostics-reports")
        report_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = report_dir / f"claude_runtime_report_{timestamp}.json"
        
        with open(report_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)
            
        print(f"\n{GREEN}Detailed report saved: {report_file}{NC}")
        
        # Exit with appropriate code
        quick_passed = results['quick_validation'].get('passed', False)
        full_passed = results.get('full_diagnostics', {}).get('passed', True)
        overall_passed = quick_passed and full_passed
        
        sys.exit(0 if overall_passed else 1)
        
    except Exception as e:
        print(f"{RED}Claude Runtime Integration failed: {str(e)}{NC}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())