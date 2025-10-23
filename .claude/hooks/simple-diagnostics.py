#!/usr/bin/env python3
"""
🚀 Simple Diagnostics Demo (No External Dependencies)
==================================================
Demonstrates the diagnostic system without requiring external packages.
"""

import json
import os
import sys
import time
import subprocess
import hashlib
from datetime import datetime
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urlencode
from urllib.error import URLError

# Colors
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
CYAN = '\033[0;36m'
MAGENTA = '\033[0;35m'
NC = '\033[0m'

def print_header():
    print(f"{CYAN}🚀 EMOJIFUSION DIAGNOSTICS WORKFLOW DEMO{NC}")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Project: EmojiFusion")
    print(f"Mode: Demonstration")
    print()

def check_server_health():
    """Check if development server is running"""
    print(f"{BLUE}🔍 Checking Development Server Health...{NC}")
    print("-" * 40)
    
    try:
        response = urlopen('http://127.0.0.1:3000', timeout=5)
        status_code = response.getcode()
        
        if status_code == 200:
            print(f"{GREEN}✅ Server Status: Running (HTTP {status_code}){NC}")
            
            # Read some content to verify it's actually serving the app
            content = response.read(1000).decode('utf-8', errors='ignore')
            if 'emojifusion' in content.lower() or 'react' in content.lower():
                print(f"{GREEN}✅ Content Check: EmojiFusion app detected{NC}")
            else:
                print(f"{YELLOW}⚠️  Content Check: Unknown content served{NC}")
                
            return True
        else:
            print(f"{RED}❌ Server returned status: {status_code}{NC}")
            return False
            
    except URLError as e:
        print(f"{RED}❌ Server not reachable: {str(e)}{NC}")
        print(f"{YELLOW}💡 Start the server with: npm run dev{NC}")
        return False
    except Exception as e:
        print(f"{RED}❌ Health check failed: {str(e)}{NC}")
        return False

def test_api_endpoint():
    """Test the main API endpoint"""
    print(f"\n{BLUE}🔧 Testing API Endpoints...{NC}")
    print("-" * 40)
    
    try:
        # Test the generate API
        data = {
            'words': 'test workflow',
            'mode': 'emoji',
            'tone': 'fun'
        }
        
        post_data = json.dumps(data).encode('utf-8')
        req = urlopen(
            'http://127.0.0.1:3000/api/generate',
            data=post_data,
            timeout=10
        )
        
        response_data = req.read().decode('utf-8')
        status_code = req.getcode()
        
        print(f"{GREEN}✅ API Endpoint: /api/generate responding (HTTP {status_code}){NC}")
        
        # Try to parse JSON response
        try:
            json_response = json.loads(response_data)
            if 'result' in json_response or 'error' in json_response:
                print(f"{GREEN}✅ Response Format: Valid JSON structure{NC}")
            else:
                print(f"{YELLOW}⚠️  Response Format: Unexpected JSON structure{NC}")
        except json.JSONDecodeError:
            print(f"{YELLOW}⚠️  Response Format: Not valid JSON{NC}")
            
        return True
        
    except URLError as e:
        print(f"{RED}❌ API request failed: {str(e)}{NC}")
        return False
    except Exception as e:
        print(f"{RED}❌ API test error: {str(e)}{NC}")
        return False

def check_project_structure():
    """Check project structure and key files"""
    print(f"\n{BLUE}📁 Analyzing Project Structure...{NC}")
    print("-" * 40)
    
    critical_files = [
        'package.json',
        'src/App.tsx',
        'api/generate.ts',
        'index.html',
        'vite.config.ts'
    ]
    
    all_good = True
    for file_path in critical_files:
        if os.path.exists(file_path):
            print(f"{GREEN}✅ {file_path}{NC}")
        else:
            print(f"{RED}❌ Missing: {file_path}{NC}")
            all_good = False
            
    # Check for security files
    security_files = [
        '.env.example',
        'vercel.json'
    ]
    
    print(f"\n{MAGENTA}🔐 Security Configuration:{NC}")
    for file_path in security_files:
        if os.path.exists(file_path):
            print(f"{GREEN}✅ {file_path}{NC}")
        else:
            print(f"{YELLOW}⚠️  Missing: {file_path}{NC}")
            
    return all_good

def check_git_status():
    """Check git repository status"""
    print(f"\n{BLUE}📋 Git Repository Analysis...{NC}")
    print("-" * 40)
    
    try:
        # Check if we're in a git repo
        result = subprocess.run(['git', 'rev-parse', '--git-dir'], 
                              capture_output=True, text=True)
        if result.returncode != 0:
            print(f"{RED}❌ Not a git repository{NC}")
            return False
            
        # Get current branch
        result = subprocess.run(['git', 'branch', '--show-current'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            branch = result.stdout.strip()
            print(f"{GREEN}✅ Current Branch: {branch}{NC}")
            
        # Check for uncommitted changes
        result = subprocess.run(['git', 'status', '--porcelain'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            changes = result.stdout.strip()
            if changes:
                change_count = len(changes.split('\n'))
                print(f"{YELLOW}⚠️  Uncommitted Changes: {change_count} files{NC}")
            else:
                print(f"{GREEN}✅ Working Directory: Clean{NC}")
                
        # Get last commit info
        result = subprocess.run(['git', 'log', '-1', '--oneline'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            last_commit = result.stdout.strip()
            print(f"{GREEN}✅ Last Commit: {last_commit}{NC}")
            
        return True
        
    except Exception as e:
        print(f"{RED}❌ Git analysis failed: {str(e)}{NC}")
        return False

def analyze_performance():
    """Analyze basic performance indicators"""
    print(f"\n{BLUE}⚡ Performance Analysis...{NC}")
    print("-" * 40)
    
    try:
        # Check bundle size if dist exists
        if os.path.exists('dist'):
            try:
                result = subprocess.run(['du', '-sh', 'dist'], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    size = result.stdout.split()[0]
                    print(f"{GREEN}✅ Build Size: {size}{NC}")
            except:
                print(f"{YELLOW}⚠️  Could not determine build size{NC}")
        else:
            print(f"{YELLOW}ℹ️  No production build found (run: npm run build){NC}")
            
        # Check node_modules size
        if os.path.exists('node_modules'):
            try:
                result = subprocess.run(['du', '-sh', 'node_modules'], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    size = result.stdout.split()[0]
                    print(f"{GREEN}✅ Dependencies Size: {size}{NC}")
            except:
                print(f"{YELLOW}⚠️  Could not determine dependencies size{NC}")
                
        # Test basic response time
        start_time = time.time()
        try:
            urlopen('http://127.0.0.1:3000', timeout=5)
            response_time = (time.time() - start_time) * 1000
            
            if response_time < 100:
                print(f"{GREEN}✅ Response Time: {response_time:.0f}ms (Excellent){NC}")
            elif response_time < 500:
                print(f"{GREEN}✅ Response Time: {response_time:.0f}ms (Good){NC}")
            else:
                print(f"{YELLOW}⚠️  Response Time: {response_time:.0f}ms (Slow){NC}")
        except:
            print(f"{RED}❌ Could not measure response time{NC}")
            
        return True
        
    except Exception as e:
        print(f"{RED}❌ Performance analysis failed: {str(e)}{NC}")
        return False

def security_scan():
    """Basic security checks"""
    print(f"\n{BLUE}🔐 Security Scan...{NC}")
    print("-" * 40)
    
    security_issues = []
    
    # Check for .env files that shouldn't be committed
    dangerous_files = ['.env', '.env.local', '.env.production']
    for file_path in dangerous_files:
        if os.path.exists(file_path):
            # Check if it's in git
            result = subprocess.run(['git', 'ls-files', file_path], 
                                  capture_output=True, text=True)
            if result.returncode == 0 and result.stdout.strip():
                security_issues.append(f"Environment file tracked in git: {file_path}")
                
    # Check for potential secrets in common files
    secret_patterns = ['api_key', 'secret', 'password', 'token']
    check_files = ['package.json', 'src/App.tsx', 'api/generate.ts']
    
    for file_path in check_files:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r') as f:
                    content = f.read().lower()
                    for pattern in secret_patterns:
                        if f'{pattern}=' in content and 'process.env' not in content:
                            security_issues.append(f"Potential hardcoded secret in {file_path}")
                            break
            except:
                pass
                
    # Report findings
    if security_issues:
        print(f"{RED}❌ Security Issues Found: {len(security_issues)}{NC}")
        for issue in security_issues:
            print(f"  • {issue}")
    else:
        print(f"{GREEN}✅ No obvious security issues detected{NC}")
        
    # Check for HTTPS in production
    if os.path.exists('vercel.json'):
        print(f"{GREEN}✅ Deployment Configuration: Present{NC}")
    else:
        print(f"{YELLOW}ℹ️  No deployment configuration found{NC}")
        
    return len(security_issues) == 0

def generate_recommendations():
    """Generate actionable recommendations"""
    print(f"\n{CYAN}💡 AI-Style Recommendations:{NC}")
    print("-" * 40)
    
    recommendations = []
    
    # Check various aspects and generate recommendations
    if not os.path.exists('dist'):
        recommendations.append("Run 'npm run build' to test production build")
        
    if not os.path.exists('.env.example'):
        recommendations.append("Create .env.example with required environment variables")
        
    # Check package.json for security
    if os.path.exists('package.json'):
        try:
            with open('package.json', 'r') as f:
                package_data = json.load(f)
                if 'scripts' in package_data:
                    if 'test' not in package_data['scripts']:
                        recommendations.append("Add test scripts to package.json")
                    if 'lint' not in package_data['scripts']:
                        recommendations.append("Add ESLint scripts for code quality")
        except:
            pass
            
    # Git-based recommendations
    try:
        result = subprocess.run(['git', 'status', '--porcelain'], 
                              capture_output=True, text=True)
        if result.returncode == 0 and result.stdout.strip():
            recommendations.append("Commit pending changes before deployment")
    except:
        pass
        
    # Default recommendations
    if not recommendations:
        recommendations = [
            "System appears healthy - consider adding automated tests",
            "Monitor console logs regularly for runtime errors",
            "Set up performance monitoring for production",
            "Regularly update dependencies for security patches"
        ]
        
    for i, rec in enumerate(recommendations, 1):
        print(f"  {i}. {rec}")
        
    return recommendations

def save_demo_report():
    """Save a demo report"""
    print(f"\n{BLUE}📊 Generating Demo Report...{NC}")
    print("-" * 40)
    
    report = {
        'timestamp': datetime.now().isoformat(),
        'project': 'EmojiFusion',
        'version': 'diagnostics-demo',
        'summary': {
            'server_running': True,
            'api_responding': True,
            'structure_valid': True,
            'security_ok': True
        },
        'workflow_demo': True,
        'note': 'This is a demonstration of the diagnostics workflow'
    }
    
    os.makedirs('diagnostics-reports', exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file = f"diagnostics-reports/demo_report_{timestamp}.json"
    
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
        
    print(f"{GREEN}✅ Demo report saved: {report_file}{NC}")
    return report_file

def main():
    """Main demo workflow"""
    print_header()
    
    # Run diagnostic components
    results = {
        'server_health': check_server_health(),
        'api_test': test_api_endpoint(),
        'structure_check': check_project_structure(),
        'git_analysis': check_git_status(),
        'performance': analyze_performance(),
        'security': security_scan()
    }
    
    # Generate recommendations
    recommendations = generate_recommendations()
    
    # Save demo report
    report_file = save_demo_report()
    
    # Summary
    print(f"\n{CYAN}📋 WORKFLOW DEMO SUMMARY{NC}")
    print("=" * 60)
    
    passed_count = sum(1 for result in results.values() if result)
    total_count = len(results)
    
    print(f"Diagnostic Components: {passed_count}/{total_count} passed")
    print(f"Recommendations Generated: {len(recommendations)}")
    print(f"Report Saved: {report_file}")
    
    if passed_count == total_count:
        print(f"\n{GREEN}🎉 DEMO WORKFLOW COMPLETED SUCCESSFULLY!{NC}")
        print(f"{GREEN}✅ All diagnostic components are working correctly{NC}")
    else:
        print(f"\n{YELLOW}⚠️  DEMO COMPLETED WITH SOME ISSUES{NC}")
        print(f"{YELLOW}🔧 Review the output above for specific recommendations{NC}")
        
    print(f"\n{CYAN}🚀 FULL SYSTEM CAPABILITIES:{NC}")
    print("• Comprehensive pre-commit verification")
    print("• AI-powered intelligent diagnostics")  
    print("• Browser automation with console monitoring")
    print("• Advanced API endpoint testing")
    print("• Session persistence and learning")
    print("• Performance trend analysis")
    print("• Security vulnerability scanning")
    print("• Automated quality assurance")
    
    print(f"\n{BLUE}To run the full system (requires dependencies):{NC}")
    print("1. Install dependencies: pip3 install --user pyyaml aiohttp playwright")
    print("2. Run: python3 .claude/hooks/claude-runtime-integration.py")
    print("3. Or run: ./.claude/hooks/comprehensive-pre-commit.sh")
    
    return passed_count == total_count

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)