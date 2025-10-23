// 🔍 EmojiFusion Console Monitor
// ==============================
// Paste this script in browser console to monitor for issues
// Or save as bookmark: javascript:(function(){...code...})();

(function() {
    'use strict';
    
    // Console styling
    const styles = {
        header: 'background: #4CAF50; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold;',
        success: 'background: #4CAF50; color: white; padding: 2px 8px; border-radius: 3px;',
        warning: 'background: #FF9800; color: white; padding: 2px 8px; border-radius: 3px;',
        error: 'background: #F44336; color: white; padding: 2px 8px; border-radius: 3px;',
        info: 'background: #2196F3; color: white; padding: 2px 8px; border-radius: 3px;'
    };
    
    console.log('%c🔍 EmojiFusion Console Monitor Started', styles.header);
    console.log('%cVersion: 1.0 | Mode: Development Testing', styles.info);
    
    // Error tracking
    let errorCount = 0;
    let warningCount = 0;
    let networkErrorCount = 0;
    let testResults = {
        passed: 0,
        failed: 0,
        warnings: 0
    };
    
    // Original console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    
    // Enhanced error logging
    console.error = function(...args) {
        errorCount++;
        console.log(`%c❌ ERROR #${errorCount}`, styles.error, ...args);
        testResults.failed++;
        originalError.apply(console, args);
        
        // Auto-check for common issues
        const errorMsg = args.join(' ').toLowerCase();
        if (errorMsg.includes('network')) {
            console.log('%c🌐 Network error detected - check API endpoints', styles.error);
        }
        if (errorMsg.includes('cors')) {
            console.log('%c🔒 CORS error detected - check security headers', styles.error);
        }
        if (errorMsg.includes('undefined')) {
            console.log('%c⚠️  Undefined variable/property - check code paths', styles.warning);
        }
    };
    
    // Enhanced warning logging
    console.warn = function(...args) {
        warningCount++;
        console.log(`%c⚠️  WARNING #${warningCount}`, styles.warning, ...args);
        testResults.warnings++;
        originalWarn.apply(console, args);
    };
    
    // Network monitoring
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        const startTime = Date.now();
        
        console.log(`%c🌐 API Request: ${url}`, styles.info);
        
        return originalFetch.apply(this, args).then(response => {
            const duration = Date.now() - startTime;
            
            if (response.ok) {
                console.log(`%c✅ API Success: ${url} (${duration}ms)`, styles.success);
                testResults.passed++;
            } else {
                networkErrorCount++;
                console.log(`%c❌ API Failed: ${url} - Status: ${response.status} (${duration}ms)`, styles.error);
                testResults.failed++;
            }
            
            if (duration > 3000) {
                console.log(`%c⚠️  Slow API: ${url} took ${duration}ms`, styles.warning);
                testResults.warnings++;
            }
            
            return response;
        }).catch(error => {
            networkErrorCount++;
            console.log(`%c❌ Network Error: ${url}`, styles.error, error);
            testResults.failed++;
            throw error;
        });
    };
    
    // Performance monitoring
    function checkPerformance() {
        if (performance.timing) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            const domReady = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
            
            console.log(`%c⚡ Performance Check:`, styles.info);
            console.log(`   Page Load: ${loadTime}ms`);
            console.log(`   DOM Ready: ${domReady}ms`);
            
            if (loadTime > 3000) {
                console.log(`%c⚠️  Slow page load: ${loadTime}ms`, styles.warning);
                testResults.warnings++;
            } else {
                console.log(`%c✅ Good page performance`, styles.success);
                testResults.passed++;
            }
        }
    }
    
    // Memory monitoring
    function checkMemory() {
        if (performance.memory) {
            const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
            const total = Math.round(performance.memory.totalJSHeapSize / 1048576);
            
            console.log(`%c💾 Memory Usage: ${used}MB / ${total}MB`, styles.info);
            
            if (used > 100) {
                console.log(`%c⚠️  High memory usage: ${used}MB`, styles.warning);
                testResults.warnings++;
            } else {
                console.log(`%c✅ Good memory usage`, styles.success);
                testResults.passed++;
            }
        }
    }
    
    // DOM monitoring
    function checkDOM() {
        const errors = [];
        
        // Check for missing alt text
        const images = document.querySelectorAll('img:not([alt])');
        if (images.length > 0) {
            errors.push(`${images.length} images missing alt text`);
        }
        
        // Check for missing labels
        const inputs = document.querySelectorAll('input:not([aria-label]):not([id])');
        if (inputs.length > 0) {
            errors.push(`${inputs.length} inputs missing labels`);
        }
        
        // Check for console errors in React
        const reactErrors = document.querySelectorAll('.react-error-boundary');
        if (reactErrors.length > 0) {
            errors.push(`${reactErrors.length} React error boundaries triggered`);
        }
        
        if (errors.length > 0) {
            console.log(`%c⚠️  DOM Issues:`, styles.warning);
            errors.forEach(error => console.log(`   • ${error}`));
            testResults.warnings += errors.length;
        } else {
            console.log(`%c✅ DOM structure looks good`, styles.success);
            testResults.passed++;
        }
    }
    
    // Automated testing functions
    window.EmojiTestMonitor = {
        // Test core functionality
        testGeneration: function() {
            console.log(`%c🧪 Testing EmojiFusion Generation...`, styles.header);
            
            const wordsInput = document.querySelector('input[placeholder*="taco"]') || 
                             document.querySelector('input[type="text"]');
            const generateBtn = document.querySelector('button:not(.pill)') || 
                              document.querySelector('button[onclick*="generate"]');
            
            if (!wordsInput || !generateBtn) {
                console.log(`%c❌ Could not find input or generate button`, styles.error);
                testResults.failed++;
                return false;
            }
            
            // Test scenario
            wordsInput.value = 'coffee morning test';
            wordsInput.dispatchEvent(new Event('change', { bubbles: true }));
            
            console.log(`%c🔬 Triggering generation...`, styles.info);
            generateBtn.click();
            
            // Check for results after delay
            setTimeout(() => {
                const results = document.querySelectorAll('.combo, .item, [data-combo]');
                if (results.length > 0) {
                    console.log(`%c✅ Generation successful: ${results.length} combos`, styles.success);
                    testResults.passed++;
                } else {
                    console.log(`%c❌ No results generated`, styles.error);
                    testResults.failed++;
                }
            }, 3000);
            
            return true;
        },
        
        // Test copy functionality
        testCopy: function() {
            console.log(`%c📋 Testing copy functionality...`, styles.info);
            
            const copyButtons = document.querySelectorAll('button[onclick*="copy"], .pill');
            if (copyButtons.length > 0) {
                copyButtons[0].click();
                console.log(`%c✅ Copy button clickable`, styles.success);
                testResults.passed++;
            } else {
                console.log(`%c⚠️  No copy buttons found`, styles.warning);
                testResults.warnings++;
            }
        },
        
        // Test mode switching
        testModes: function() {
            console.log(`%c🎛️  Testing mode switching...`, styles.info);
            
            const modeButtons = document.querySelectorAll('button[role="radio"]');
            if (modeButtons.length >= 3) {
                modeButtons.forEach((btn, idx) => {
                    setTimeout(() => {
                        btn.click();
                        console.log(`%c✅ Mode ${idx + 1} selectable`, styles.success);
                        testResults.passed++;
                    }, idx * 500);
                });
            } else {
                console.log(`%c❌ Insufficient mode buttons found`, styles.error);
                testResults.failed++;
            }
        },
        
        // Run full test suite
        runAll: function() {
            console.clear();
            console.log(`%c🚀 Running Full EmojiFusion Test Suite`, styles.header);
            
            // Reset counters
            errorCount = 0;
            warningCount = 0;
            networkErrorCount = 0;
            testResults = { passed: 0, failed: 0, warnings: 0 };
            
            // Run tests
            checkPerformance();
            setTimeout(checkMemory, 1000);
            setTimeout(checkDOM, 2000);
            setTimeout(() => this.testGeneration(), 3000);
            setTimeout(() => this.testCopy(), 6000);
            setTimeout(() => this.testModes(), 7000);
            
            // Final report
            setTimeout(() => {
                this.generateReport();
            }, 10000);
        },
        
        // Generate test report
        generateReport: function() {
            console.log(`%c📊 TEST REPORT`, styles.header);
            console.log(`%c✅ Passed: ${testResults.passed}`, styles.success);
            console.log(`%c⚠️  Warnings: ${testResults.warnings}`, styles.warning);
            console.log(`%c❌ Failed: ${testResults.failed}`, styles.error);
            console.log(`%c🌐 Network Errors: ${networkErrorCount}`, networkErrorCount > 0 ? styles.error : styles.success);
            
            const total = testResults.passed + testResults.failed + testResults.warnings;
            const score = total > 0 ? Math.round((testResults.passed / total) * 100) : 0;
            
            console.log(`%c📈 Overall Score: ${score}%`, score >= 80 ? styles.success : score >= 60 ? styles.warning : styles.error);
            
            if (testResults.failed === 0 && networkErrorCount === 0) {
                console.log(`%c🎉 ALL CRITICAL TESTS PASSED!`, styles.success);
                console.log(`%c✅ Ready for commit`, styles.success);
            } else {
                console.log(`%c🚨 CRITICAL ISSUES FOUND`, styles.error);
                console.log(`%c❌ Do not commit until issues are resolved`, styles.error);
            }
        }
    };
    
    // Auto-run basic checks
    setTimeout(checkPerformance, 1000);
    setTimeout(checkMemory, 2000);
    setTimeout(checkDOM, 3000);
    
    // Instructions
    console.log(`%c📋 Available Commands:`, styles.info);
    console.log(`   EmojiTestMonitor.runAll() - Run complete test suite`);
    console.log(`   EmojiTestMonitor.testGeneration() - Test generation only`);
    console.log(`   EmojiTestMonitor.generateReport() - Show current status`);
    console.log(`%c💡 Monitor will track all errors, warnings, and API calls automatically`, styles.info);
    
})();