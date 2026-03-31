#!/usr/bin/env node

/* * 
* Data reset script 
* Used to reset the data of payment_history and monthly_category_summary tables */

const Database = require('better-sqlite3');
const config = require('../config');
const MonthlyCategorySummaryService = require('../services/monthlyCategorySummaryService');
const logger = require('../utils/logger');

const dbPath = config.getDatabasePath();

console.log('🔧 数据重置脚本');
console.log(`📂 数据库路径: ${dbPath}`);

// Parse command line arguments
const args = process.argv.slice(2);
const resetPaymentHistory = args.includes('--payment-history') || args.includes('--all');
const resetMonthlyCategorySummary = args.includes('--monthly-category-summary') || args.includes('--all');
const recalculateAfterReset = args.includes('--recalculate');
const rebuildFromSubscriptions = args.includes('--rebuild-from-subscriptions');

if (!resetPaymentHistory && !resetMonthlyCategorySummary && !rebuildFromSubscriptions) {
    console.log(`
使用方法:
  node resetData.js [选项]

选项:
  --payment-history              重置 payment_history 表
  --monthly-expenses             重置 monthly_expenses 表
  --all                          重置所有表
  --recalculate                  重置后重新计算 monthly_expenses（仅在重置 payment_history 时有效）
  --rebuild-from-subscriptions   从 subscriptions 表重建 payment_history，然后重新计算 monthly_expenses

示例:
  node resetData.js --all                           # 重置所有表
  node resetData.js --payment-history               # 仅重置 payment_history
  node resetData.js --monthly-expenses              # 仅重置 monthly_expenses
  node resetData.js --payment-history --recalculate # 重置 payment_history 并重新计算 monthly_expenses
  node resetData.js --rebuild-from-subscriptions    # 从订阅数据重建所有支付历史和月度支出
`);
    process.exit(0);
}

async function resetData() {
    let db;
    let monthlyExpenseService;

    try {
        // Connect to database
        db = new Database(dbPath);
        logger.info('数据库连接成功');

        // Check to make sure the necessary tables exist
        await ensureTablesExist(db);

        // Reset payment_history table
        if (resetPaymentHistory) {
            console.log('\n📝 重置 payment_history 表...');
            
            // Get the current number of records
            const countStmt = db.prepare('SELECT COUNT(*) as count FROM payment_history');
            const currentCount = countStmt.get().count;
            console.log(`📊 当前记录数: ${currentCount}`);
            
            if (currentCount > 0) {
                // Delete all records
                const deleteStmt = db.prepare('DELETE FROM payment_history');
                const result = deleteStmt.run();
                console.log(`🗑️  已删除 ${result.changes} 条 payment_history 记录`);
            } else {
                console.log('ℹ️  payment_history 表已经是空的');
            }
        }

        // Reset monthly_expenses table
        if (resetMonthlyExpenses) {
            console.log('\n📝 重置 monthly_expenses 表...');
            
            monthlyExpenseService = new MonthlyExpenseService(dbPath);
            
            // Get the current number of records
            const countStmt = db.prepare('SELECT COUNT(*) as count FROM monthly_expenses');
            const currentCount = countStmt.get().count;
            console.log(`📊 当前记录数: ${currentCount}`);
            
            if (currentCount > 0) {
                // Delete all records
                const deleteStmt = db.prepare('DELETE FROM monthly_expenses');
                const result = deleteStmt.run();
                console.log(`🗑️  已删除 ${result.changes} 条 monthly_expenses 记录`);
            } else {
                console.log('ℹ️  monthly_expenses 表已经是空的');
            }
        }

        // Rebuild payment_history from subscription data (if needed)
        if (rebuildFromSubscriptions) {
            console.log('\n🔄 从 subscriptions 表重建 payment_history...');

            // Clear payment_history first
            const deletePaymentStmt = db.prepare('DELETE FROM payment_history');
            const deleteResult = deletePaymentStmt.run();
            console.log(`🗑️  清空了 ${deleteResult.changes} 条现有 payment_history 记录`);

            // Rebuild payment_history
            const rebuiltCount = rebuildPaymentHistoryFromSubscriptions(db);
            console.log(`✅ 从订阅数据重建了 ${rebuiltCount} 条 payment_history 记录`);

            // Recalculate monthly_expenses
            console.log('\n🔄 重新计算 monthly_expenses...');
            if (!monthlyExpenseService) {
                monthlyExpenseService = new MonthlyExpenseService(dbPath);
            }
            monthlyExpenseService.recalculateAllMonthlyExpenses();
            console.log('✅ monthly_expenses 重新计算完成');
        }

        // Recalculate monthly_expenses (if needed)
        if (resetPaymentHistory && recalculateAfterReset && !rebuildFromSubscriptions) {
            console.log('\n🔄 重新计算 monthly_expenses...');

            if (!monthlyExpenseService) {
                monthlyExpenseService = new MonthlyExpenseService(dbPath);
            }

            monthlyExpenseService.recalculateAllMonthlyExpenses();
            console.log('✅ monthly_expenses 重新计算完成');
        }

        console.log('\n🎉 数据重置完成!');
        
        // Show final status
        console.log('\n📊 最终状态:');
        const paymentCount = db.prepare('SELECT COUNT(*) as count FROM payment_history').get().count;
        const expenseCount = db.prepare('SELECT COUNT(*) as count FROM monthly_expenses').get().count;
        console.log(`   payment_history: ${paymentCount} 条记录`);
        console.log(`   monthly_expenses: ${expenseCount} 条记录`);

    } catch (error) {
        console.error('❌ 重置失败:', error.message);
        process.exit(1);
    } finally {
        // Clean up resources
        if (monthlyExpenseService) {
            monthlyExpenseService.close();
        }
        if (db) {
            db.close();
        }
    }
}

/* * 
* Rebuild payment_history from subscription data */
function rebuildPaymentHistoryFromSubscriptions(db) {
    console.log('📝 开始从订阅数据重建支付历史...');

    // Get all subscriptions
    const subscriptions = db.prepare(`
        SELECT id, start_date, billing_cycle, amount, currency, last_billing_date, status
        FROM subscriptions
        WHERE start_date IS NOT NULL
    `).all();

    console.log(`📊 找到 ${subscriptions.length} 个订阅需要处理`);

    if (subscriptions.length === 0) {
        console.log('⚠️  没有找到订阅数据，无法重建 payment_history');
        return 0;
    }

    const insertPayment = db.prepare(`
        INSERT INTO payment_history (
            subscription_id, payment_date, amount_paid, currency,
            billing_period_start, billing_period_end, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let totalPayments = 0;

    for (const sub of subscriptions) {
        try {
            console.log(`🔄 处理订阅: ${sub.id} (${sub.billing_cycle})`);
            const payments = generateHistoricalPayments(sub);

            for (const payment of payments) {
                insertPayment.run(
                    sub.id,
                    payment.payment_date,
                    sub.amount,
                    sub.currency,
                    payment.billing_period_start,
                    payment.billing_period_end,
                    'succeeded',
                    'Rebuilt from subscription data'
                );
                totalPayments++;
            }

            console.log(`   ✅ 为订阅 ${sub.id} 生成了 ${payments.length} 条支付记录`);
        } catch (error) {
            console.error(`   ❌ 处理订阅 ${sub.id} 时出错:`, error.message);
        }
    }

    console.log(`✅ 总共重建了 ${totalPayments} 条支付记录`);
    return totalPayments;
}

/* * 
* Make sure the necessary tables exist, run migrations if they don't exist */
async function ensureTablesExist(db) {
    logger.info('检查数据库表是否存在...');

    const requiredTables = ['payment_history', 'monthly_expenses'];
    const missingTables = [];

    for (const tableName of requiredTables) {
        const tableExists = db.prepare(`
            SELECT name FROM sqlite_master
            WHERE type='table' AND name=?
        `).get(tableName);

        if (!tableExists) {
            missingTables.push(tableName);
        }
    }

    if (missingTables.length > 0) {
        logger.warn(`缺少必要的表: ${missingTables.join(', ')}，正在运行数据库迁移...`);

        try {
            // Run database migration
            const DatabaseMigrations = require('../db/migrations');
            const migrations = new DatabaseMigrations(dbPath);

            await migrations.runMigrations();
            logger.info('数据库迁移完成');
            migrations.close();
        } catch (migrationError) {
            logger.error('数据库迁移失败:', migrationError.message);
            throw migrationError;
        }
    } else {
        logger.info('所有必要的表都已存在');
    }
}

/* * 
* Generate historical payment records */
function generateHistoricalPayments(subscription) {
    const payments = [];
    const startDate = new Date(subscription.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If the subscription is canceled and there is no last billing date, only the initial payment is created
    if (subscription.status === 'cancelled' && !subscription.last_billing_date) {
        const billingPeriodEnd = calculateNextBillingDate(startDate, subscription.billing_cycle);
        payments.push({
            payment_date: startDate.toISOString().split('T')[0],
            billing_period_start: startDate.toISOString().split('T')[0],
            billing_period_end: billingPeriodEnd.toISOString().split('T')[0]
        });
        return payments;
    }

    // Generate payment records from start date to last billing date or today
    let currentDate = new Date(startDate);
    const endDate = subscription.last_billing_date ?
        new Date(subscription.last_billing_date) : today;

    while (currentDate <= endDate) {
        const nextBillingDate = calculateNextBillingDate(currentDate, subscription.billing_cycle);

        payments.push({
            payment_date: currentDate.toISOString().split('T')[0],
            billing_period_start: currentDate.toISOString().split('T')[0],
            billing_period_end: nextBillingDate.toISOString().split('T')[0]
        });

        currentDate = new Date(nextBillingDate);
    }

    return payments;
}

/* * 
* Calculate next billing date */
function calculateNextBillingDate(date, billingCycle) {
    const nextDate = new Date(date);

    switch (billingCycle) {
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
        case 'semiannual':
            nextDate.setMonth(nextDate.getMonth() + 6);
            break;
        default:
            throw new Error(`未知的计费周期: ${billingCycle}`);
    }

    return nextDate;
}

// Perform a reset
resetData();
