/* * 
* Notification template configuration 
* Supports multiple languages and notification types */

const createPremiumHtml = ({ badgeColor, badgeBg, badgeText, title, description, fields }) => {
  const fieldsHtml = fields.map(f => `
    <tr>
      <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${f.label}</td>
      <td style="padding: 12px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e2e8f0;">${f.value}</td>
    </tr>
  `).join('');

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 10px; min-height: 100%; width: 100%;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e4e4e7;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">Subscription Manager</h1>
    </div>
    
    <!-- Body -->
    <div style="padding: 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="display: inline-block; padding: 6px 14px; background-color: ${badgeBg}; color: ${badgeColor}; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 15px; letter-spacing: 0.2px;">${badgeText}</span>
        <h2 style="margin: 0 0 10px 0; color: #18181b; font-size: 20px; font-weight: 700; line-height: 1.4;">${title}</h2>
        <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">${description}</p>
      </div>

      <div style="background-color: #fafafa; border-radius: 12px; padding: 20px; margin-bottom: 30px; border: 1px solid #f4f4f5;">
        <table style="width: 100%; border-collapse: collapse;">
          ${fieldsHtml}
        </table>
      </div>

      <div style="text-align: center; margin-top: 30px; border-top: 1px solid #f4f4f5; padding-top: 25px;">
        <p style="margin: 0; color: #a1a1aa; font-size: 12px;">This is an automated notification from your Subscription Management Space.</p>
      </div>
    </div>
  </div>
</div>`;
};

const NOTIFICATION_TEMPLATES = {
  // Renewal reminder
  renewal_reminder: {
    'zh-CN': {
      telegram: {
        content: `<b>续订提醒</b>\n\n📢 <b>{{name}}</b> 即将到期\n\n📅 到期时间: {{next_billing_date}}\n💰 金额: {{amount}} {{currency}}\n💳 支付方式: {{payment_method}}\n📋 计划: {{plan}}\n\n请及时续订以避免服务中断。`
      },
      email: {
        subject: '订阅续订提醒 - {{name}}',
        content: createPremiumHtml({
          badgeColor: '#b45309', badgeBg: '#fef3c7', badgeText: '⏳ 即将续订 / Expiring Soon',
          title: '{{name}} 即将到期',
          description: '您的订阅服务即将到期并尝试续费。',
          fields: [
            { label: '服务名称', value: '{{name}}' },
            { label: '到期时间', value: '{{next_billing_date}}' },
            { label: '续订金额', value: '{{amount}} {{currency}}' },
            { label: '支付方式', value: '{{payment_method}}' },
            { label: '订阅计划', value: '{{plan}}' }
          ]
        })
      }
    },
    'en': {
      telegram: {
        content: `<b>Renewal Reminder</b>\n\n📢 <b>{{name}}</b> is about to expire\n\n📅 Expiration: {{next_billing_date}}\n💰 Amount: {{amount}} {{currency}}\n💳 Payment: {{payment_method}}\n📋 Plan: {{plan}}\n\nPlease renew to avoid interruption.`
      },
      email: {
        subject: 'Subscription Renewal Reminder - {{name}}',
        content: createPremiumHtml({
          badgeColor: '#b45309', badgeBg: '#fef3c7', badgeText: '⏳ Expiring Soon',
          title: 'Your subscription to {{name}} is renewing',
          description: 'Your subscription service is about to expire and will attempt renewal.',
          fields: [
            { label: 'Service Name', value: '{{name}}' },
            { label: 'Expiration Date', value: '{{next_billing_date}}' },
            { label: 'Renewal Amount', value: '{{amount}} {{currency}}' },
            { label: 'Payment Method', value: '{{payment_method}}' },
            { label: 'Subscription Plan', value: '{{plan}}' }
          ]
        })
      }
    }
  },

  // Expiration warning
  expiration_warning: {
    'zh-CN': {
      telegram: {
        content: `<b>⚠️ 订阅过期警告</b>\n\n🚨 <b>{{name}}</b> 已过期\n\n📅 过期时间: {{next_billing_date}}\n💰 金额: {{amount}} {{currency}}\n💳 支付方式: {{payment_method}}\n📋 计划: {{plan}}\n\n请立即续订以恢复服务。`
      },
      email: {
        subject: '订阅过期警告 - {{name}}',
        content: createPremiumHtml({
          badgeColor: '#b91c1c', badgeBg: '#fee2e2', badgeText: '🚨 已过期 / Expired',
          title: '{{name}} 订阅已过期',
          description: '您的服务已到期，请立即处理以恢复使用。',
          fields: [
            { label: '服务名称', value: '{{name}}' },
            { label: '过期时间', value: '{{next_billing_date}}' },
            { label: '续订金额', value: '{{amount}} {{currency}}' },
            { label: '支付方式', value: '{{payment_method}}' },
            { label: '订阅计划', value: '{{plan}}' }
          ]
        })
      }
    },
    'en': {
      telegram: {
        content: `<b>⚠️ Subscription Expiration Warning</b>\n\n🚨 <b>{{name}}</b> has expired\n\n📅 Expiration: {{next_billing_date}}\n💰 Amount: {{amount}} {{currency}}\n💳 Payment: {{payment_method}}\n📋 Plan: {{plan}}\n\nPlease renew immediately.`
      },
      email: {
        subject: 'Subscription Expiration Warning - {{name}}',
        content: createPremiumHtml({
          badgeColor: '#b91c1c', badgeBg: '#fee2e2', badgeText: '🚨 Expired',
          title: '{{name}} has expired',
          description: 'Your subscription has ended. Please renew to restore service.',
          fields: [
            { label: 'Service Name', value: '{{name}}' },
            { label: 'Expired On', value: '{{next_billing_date}}' },
            { label: 'Expected Amount', value: '{{amount}} {{currency}}' },
            { label: 'Payment Method', value: '{{payment_method}}' },
            { label: 'Subscription Plan', value: '{{plan}}' }
          ]
        })
      }
    }
  },

  // Renewal successful
  renewal_success: {
    'zh-CN': {
      telegram: {
        content: `<b>✅ 续订成功</b>\n\n🎉 <b>{{name}}</b> 续订成功\n\n📅 下次续订: {{next_billing_date}}\n💰 金额: {{amount}} {{currency}}\n💳 支付方式: {{payment_method}}\n📋 计划: {{plan}}\n\n感谢您的续订！`
      },
      email: {
        subject: '续订成功确认 - {{name}}',
        content: createPremiumHtml({
          badgeColor: '#15803d', badgeBg: '#dcfce7', badgeText: '✅ 续订成功 / Success',
          title: '{{name}} 续订成功',
          description: '您的服务已顺利扣款并延长使用期。',
          fields: [
            { label: '服务名称', value: '{{name}}' },
            { label: '下次续订', value: '{{next_billing_date}}' },
            { label: '支付金额', value: '{{amount}} {{currency}}' },
            { label: '支付方式', value: '{{payment_method}}' },
            { label: '订阅计划', value: '{{plan}}' }
          ]
        })
      }
    },
    'en': {
      telegram: {
        content: `<b>✅ Renewal Successful</b>\n\n🎉 <b>{{name}}</b> renewed successfully\n\n📅 Next renewal: {{next_billing_date}}\n💰 Amount: {{amount}} {{currency}}\n💳 Payment: {{payment_method}}\n📋 Plan: {{plan}}\n\nThank you for renewing!`
      },
      email: {
        subject: 'Renewal Successful - {{name}}',
        content: createPremiumHtml({
          badgeColor: '#15803d', badgeBg: '#dcfce7', badgeText: '✅ Success',
          title: '{{name}} renewed successfully',
          description: 'Payment was processed and your subscription is active.',
          fields: [
            { label: 'Service Name', value: '{{name}}' },
            { label: 'Next Renewal', value: '{{next_billing_date}}' },
            { label: 'Amount Paid', value: '{{amount}} {{currency}}' },
            { label: 'Payment Method', value: '{{payment_method}}' },
            { label: 'Subscription Plan', value: '{{plan}}' }
          ]
        })
      }
    }
  },

  // Renewal failed
  renewal_failure: {
    'zh-CN': {
      telegram: {
        content: `<b>❌ 续订失败</b>\n\n⚠️ <b>{{name}}</b> 续订失败\n\n📅 到期时间: {{next_billing_date}}\n💰 金额: {{amount}} {{currency}}\n💳 支付方式: {{payment_method}}\n📋 计划: {{plan}}\n\n请检查支付方式。`
      },
      email: {
        subject: '续订失败通知 - {{name}}',
        content: createPremiumHtml({
          badgeColor: '#be123c', badgeBg: '#ffe4e6', badgeText: '❌ 失败 / Failed',
          title: '{{name}} 续订失败',
          description: '扣款尝试失败，请检查您的支付方式或资金余额。',
          fields: [
            { label: '服务名称', value: '{{name}}' },
            { label: '到期时间', value: '{{next_billing_date}}' },
            { label: '应付金额', value: '{{amount}} {{currency}}' },
            { label: '支付方式', value: '{{payment_method}}' },
            { label: '订阅计划', value: '{{plan}}' }
          ]
        })
      }
    },
    'en': {
      telegram: {
        content: `<b>❌ Renewal Failed</b>\n\n⚠️ <b>{{name}}</b> renewal failed\n\n📅 Expiration: {{next_billing_date}}\n💰 Amount: {{amount}} {{currency}}\n💳 Payment: {{payment_method}}\n📋 Plan: {{plan}}\n\nPlease check your payment method.`
      },
      email: {
        subject: 'Renewal Failed - {{name}}',
        content: createPremiumHtml({
          badgeColor: '#be123c', badgeBg: '#ffe4e6', badgeText: '❌ Failed',
          title: '{{name}} renewal failed',
          description: 'We encountered an issue with your payment method. Please check it.',
          fields: [
            { label: 'Service Name', value: '{{name}}' },
            { label: 'Expiration', value: '{{next_billing_date}}' },
            { label: 'Amount Due', value: '{{amount}} {{currency}}' },
            { label: 'Payment Method', value: '{{payment_method}}' },
            { label: 'Subscription Plan', value: '{{plan}}' }
          ]
        })
      }
    }
  },

  // Subscription changes
  subscription_change: {
    'zh-CN': {
      telegram: {
        content: `<b>📝 订阅变更通知</b>\n\n🔄 <b>{{name}}</b> 信息已更新\n\n📅 下次续订: {{next_billing_date}}\n💰 金额: {{amount}} {{currency}}\n💳 支付方式: {{payment_method}}\n📋 计划: {{plan}}\n\n变更已生效。`
      },
      email: {
        subject: '订阅变更通知 - {{name}}',
        content: createPremiumHtml({
          badgeColor: '#1d4ed8', badgeBg: '#dbeafe', badgeText: '📝 已更新 / Updated',
          title: '{{name}} 订阅服务已更新',
          description: '您的订阅参数已修改并生效。',
          fields: [
            { label: '服务名称', value: '{{name}}' },
            { label: '下次续订', value: '{{next_billing_date}}' },
            { label: '更新后金额', value: '{{amount}} {{currency}}' },
            { label: '支付方式', value: '{{payment_method}}' },
            { label: '订阅计划', value: '{{plan}}' }
          ]
        })
      }
    },
    'en': {
      telegram: {
        content: `<b>📝 Subscription Updated</b>\n\n🔄 <b>{{name}}</b> updated\n\n📅 Next renewal: {{next_billing_date}}\n💰 Amount: {{amount}} {{currency}}\n💳 Payment: {{payment_method}}\n📋 Plan: {{plan}}\n\nChanges applied.`
      },
      email: {
        subject: 'Subscription Change Notification - {{name}}',
        content: createPremiumHtml({
          badgeColor: '#1d4ed8', badgeBg: '#dbeafe', badgeText: '📝 Updated',
          title: '{{name}} subscription updated',
          description: 'Modifications to your subscription have been successfully applied.',
          fields: [
            { label: 'Service Name', value: '{{name}}' },
            { label: 'Next Renewal', value: '{{next_billing_date}}' },
            { label: 'Updated Amount', value: '{{amount}} {{currency}}' },
            { label: 'Payment Method', value: '{{payment_method}}' },
            { label: 'Subscription Plan', value: '{{plan}}' }
          ]
        })
      }
    }
  }
};

/* * 
* Get notification template 
* @param {string} notificationType - notification type 
* @param {string} language - language code 
* @param {string} channel - notification channel 
* @returns {Object|null} template object */
function getTemplate(notificationType, language = 'en', channel = 'telegram') {
  const typeTemplates = NOTIFICATION_TEMPLATES[notificationType];
  if (!typeTemplates) return null;

  let langTemplates = typeTemplates[language];
  if (!langTemplates) {
    const fallbackLanguages = ['en', 'zh-CN'];
    for (const fallbackLang of fallbackLanguages) {
      if (fallbackLang !== language && typeTemplates[fallbackLang]) {
        langTemplates = typeTemplates[fallbackLang];
        break;
      }
    }
  }

  if (!langTemplates) return null;
  const channelTemplate = langTemplates[channel];
  if (!channelTemplate) return null;

  return {
    notification_type: notificationType,
    language,
    channel_type: channel,
    subject_template: channelTemplate.subject || null,
    content_template: channelTemplate.content
  };
}

/* * 
* Get the list of supported languages 
* @returns {Array} Array of supported language codes */
function getSupportedLanguages() {
  const languages = new Set();
  Object.values(NOTIFICATION_TEMPLATES).forEach(typeTemplates => {
    Object.keys(typeTemplates).forEach(lang => languages.add(lang));
  });
  return Array.from(languages);
}

/* * 
* Get the list of supported notification types 
* @returns {Array} Array of supported notification types */
function getSupportedNotificationTypes() {
  return Object.keys(NOTIFICATION_TEMPLATES);
}

/* * 
* Get the list of supported channels 
* @param {string} notificationType - notification type 
* @param {string} language - language code 
* @returns {Array} Supported channel array */
function getSupportedChannels(notificationType, language = 'en') {
  const typeTemplates = NOTIFICATION_TEMPLATES[notificationType];
  if (!typeTemplates || !typeTemplates[language]) {
    return [];
  }
  return Object.keys(typeTemplates[language]);
}

module.exports = {
  NOTIFICATION_TEMPLATES,
  getTemplate,
  getSupportedLanguages,
  getSupportedNotificationTypes,
  getSupportedChannels
};
