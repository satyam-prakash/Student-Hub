import { test } from 'node:test';
import { strict as assert } from 'node:assert';

/**
 * Quick verification script for new Cash Flow Timeline components
 * Run with: node verify_cash_flow.js
 */

console.log('🔍 Verifying Cash Flow Timeline Implementation...\n');

// Check if files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
    'src/components/expenses/CashFlowTimeline.jsx',
    'src/components/expenses/IncomeEventForm.jsx',
    'src/components/expenses/AnalyticsTab.jsx',
];

let allExist = true;

requiredFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} NOT FOUND`);
        allExist = false;
    }
});

if (!allExist) {
    console.error('\n❌ Some required files are missing!');
    process.exit(1);
}

// Check AnalyticsTab integration
const analyticsTabPath = path.join(process.cwd(), 'src/components/expenses/AnalyticsTab.jsx');
const analyticsContent = fs.readFileSync(analyticsTabPath, 'utf-8');

console.log('\n🔍 Checking AnalyticsTab.jsx integration...');

const checks = [
    { name: 'CashFlowTimeline import', pattern: /import CashFlowTimeline from/ },
    { name: 'Cash Flow section', pattern: /<section id="cash-flow"/ },
    { name: 'CashFlowTimeline component usage', pattern: /<CashFlowTimeline/ },
];

checks.forEach(check => {
    if (check.pattern.test(analyticsContent)) {
        console.log(`✅ ${check.name}`);
    } else {
        console.log(`❌ ${check.name} NOT FOUND`);
        allExist = false;
    }
});

// Check expenseApi.js has income methods
const apiPath = path.join(process.cwd(), 'src/lib/expenseApi.js');
const apiContent = fs.readFileSync(apiPath, 'utf-8');

console.log('\n🔍 Checking expenseApi.js for income methods...');

const apiChecks = [
    'getIncomeEvents',
    'addIncomeEvent',
    'updateIncomeEvent',
    'deleteIncomeEvent',
];

apiChecks.forEach(method => {
    if (apiContent.includes(method)) {
        console.log(`✅ ${method} method exists`);
    } else {
        console.log(`❌ ${method} method NOT FOUND`);
        allExist = false;
    }
});

// Check SQL schema
const sqlPath = path.join(process.cwd(), 'supabase_advanced_features.sql');
if (fs.existsSync(sqlPath)) {
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    console.log('\n🔍 Checking supabase_advanced_features.sql...');
    
    if (sqlContent.includes('CREATE TABLE IF NOT EXISTS income_events')) {
        console.log('✅ income_events table definition exists');
    } else {
        console.log('❌ income_events table definition NOT FOUND');
        allExist = false;
    }
    
    if (sqlContent.includes('recurring_day_of_month')) {
        console.log('✅ recurring_day_of_month column exists');
    } else {
        console.log('❌ recurring_day_of_month column NOT FOUND');
        allExist = false;
    }
} else {
    console.log('⚠️ supabase_advanced_features.sql not found (optional if already deployed)');
}

console.log('\n' + '='.repeat(60));
if (allExist) {
    console.log('✅ ALL CHECKS PASSED! Cash Flow Timeline is fully integrated.');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm install (if not already done)');
    console.log('2. Execute supabase_advanced_features.sql in Supabase SQL Editor');
    console.log('3. Start dev server: npm run dev');
    console.log('4. Navigate to Analytics tab → Cash Flow & Income section');
    console.log('5. Test: Add income event, view cash flow chart');
    process.exit(0);
} else {
    console.log('❌ SOME CHECKS FAILED. Review errors above.');
    process.exit(1);
}
