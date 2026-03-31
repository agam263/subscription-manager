/* * 
* Notification template configuration 
* Supports multiple languages and notification types */

const NOTIFICATION_TEMPLATES = {
  // Renewal reminder
  renewal_reminder: {
    'zh-CN': {
      telegram: {
        content: `<b>续订提醒</b>

📢 <b>{{name}}</b> 即将到期

📅 到期时间: {{next_billing_date}}
💰 金额: {{amount}} {{currency}}
💳 支付方式: {{payment_method}}
📋 计划: {{plan}}

请及时续订以避免服务中断。`
      },
      email: {
        subject: '订阅续订提醒 - {{name}}',
        content: `您好，

您的订阅服务 "{{name}}" 即将到期。

订阅详情：
- 服务名称：{{name}}
- 到期时间：{{next_billing_date}}
- 续订金额：{{amount}} {{currency}}
- 支付方式：{{payment_method}}
- 订阅计划：{{plan}}

请及时续订以避免服务中断。

谢谢！`
      }
    },
    'en': {
      telegram: {
        content: `<b>Renewal Reminder</b>

📢 <b>{{name}}</b> is about to expire

📅 Expiration date: {{next_billing_date}}
💰 Amount: {{amount}} {{currency}}
💳 Payment method: {{payment_method}}
📋 Plan: {{plan}}

Please renew in time to avoid service interruption.`
      },
      email: {
        subject: 'Subscription Renewal Reminder - {{name}}',
        content: `Hello,

Your subscription service "{{name}}" is about to expire.

Subscription Details:
- Service Name: {{name}}
- Expiration Date: {{next_billing_date}}
- Renewal Amount: {{amount}} {{currency}}
- Payment Method: {{payment_method}}
- Subscription Plan: {{plan}}

Please renew in time to avoid service interruption.

Thank you!`
      }
    }
  },

  // Expiration warning
  expiration_warning: {
    'zh-CN': {
      telegram: {
        content: `<b>⚠️ 订阅过期警告</b>

🚨 <b>{{name}}</b> 已过期

📅 过期时间: {{next_billing_date}}
💰 金额: {{amount}} {{currency}}
💳 支付方式: {{payment_method}}
📋 计划: {{plan}}

请立即续订以恢复服务。`
      },
      email: {
        subject: '订阅过期警告 - {{name}}',
        content: `您好，

您的订阅服务 "{{name}}" 已经过期。

订阅详情：
- 服务名称：{{name}}
- 过期时间：{{next_billing_date}}
- 续订金额：{{amount}} {{currency}}
- 支付方式：{{payment_method}}
- 订阅计划：{{plan}}

请立即续订以恢复服务。

谢谢！`
      }
    },
    'en': {
      telegram: {
        content: `<b>⚠️ Subscription Expiration Warning</b>

🚨 <b>{{name}}</b> has expired

📅 Expiration date: {{next_billing_date}}
💰 Amount: {{amount}} {{currency}}
💳 Payment method: {{payment_method}}
📋 Plan: {{plan}}

Please renew immediately to restore service.`
      },
      email: {
        subject: 'Subscription Expiration Warning - {{name}}',
        content: `Hello,

Your subscription service "{{name}}" has expired.

Subscription Details:
- Service Name: {{name}}
- Expiration Date: {{next_billing_date}}
- Renewal Amount: {{amount}} {{currency}}
- Payment Method: {{payment_method}}
- Subscription Plan: {{plan}}

Please renew immediately to restore service.

Thank you!`
      }
    }
  },

  // Renewal successful
  renewal_success: {
    'zh-CN': {
      telegram: {
        content: `<b>✅ 续订成功</b>

🎉 <b>{{name}}</b> 续订成功

📅 下次续订: {{next_billing_date}}
💰 金额: {{amount}} {{currency}}
💳 支付方式: {{payment_method}}
📋 计划: {{plan}}

感谢您的续订！`
      },
      email: {
        subject: '续订成功确认 - {{name}}',
        content: `您好，

您的订阅服务 "{{name}}" 续订成功。

订阅详情：
- 服务名称：{{name}}
- 下次续订：{{next_billing_date}}
- 续订金额：{{amount}} {{currency}}
- 支付方式：{{payment_method}}
- 订阅计划：{{plan}}

感谢您的续订！

谢谢！`
      }
    },
    'en': {
      telegram: {
        content: `<b>✅ Renewal Successful</b>

🎉 <b>{{name}}</b> renewed successfully

📅 Next renewal: {{next_billing_date}}
💰 Amount: {{amount}} {{currency}}
💳 Payment method: {{payment_method}}
📋 Plan: {{plan}}

Thank you for your renewal!`
      },
      email: {
        subject: 'Renewal Successful - {{name}}',
        content: `Hello,

Your subscription service "{{name}}" has been renewed successfully.

Subscription Details:
- Service Name: {{name}}
- Next Renewal: {{next_billing_date}}
- Renewal Amount: {{amount}} {{currency}}
- Payment Method: {{payment_method}}
- Subscription Plan: {{plan}}

Thank you for your renewal!

Thank you!`
      }
    }
  },

  // Renewal failed
  renewal_failure: {
    'zh-CN': {
      telegram: {
        content: `<b>❌ 续订失败</b>

⚠️ <b>{{name}}</b> 续订失败

📅 到期时间: {{next_billing_date}}
💰 金额: {{amount}} {{currency}}
💳 支付方式: {{payment_method}}
📋 计划: {{plan}}

请检查支付方式并重试。`
      },
      email: {
        subject: '续订失败通知 - {{name}}',
        content: `您好，

您的订阅服务 "{{name}}" 续订失败。

订阅详情：
- 服务名称：{{name}}
- 到期时间：{{next_billing_date}}
- 续订金额：{{amount}} {{currency}}
- 支付方式：{{payment_method}}
- 订阅计划：{{plan}}

请检查支付方式并重试。

谢谢！`
      }
    },
    'en': {
      telegram: {
        content: `<b>❌ Renewal Failed</b>

⚠️ <b>{{name}}</b> renewal failed

📅 Expiration date: {{next_billing_date}}
💰 Amount: {{amount}} {{currency}}
💳 Payment method: {{payment_method}}
📋 Plan: {{plan}}

Please check your payment method and try again.`
      },
      email: {
        subject: 'Renewal Failed - {{name}}',
        content: `Hello,

Your subscription service "{{name}}" renewal has failed.

Subscription Details:
- Service Name: {{name}}
- Expiration Date: {{next_billing_date}}
- Renewal Amount: {{amount}} {{currency}}
- Payment Method: {{payment_method}}
- Subscription Plan: {{plan}}

Please check your payment method and try again.

Thank you!`
      }
    }
  },

  // Subscription changes
  subscription_change: {
    'zh-CN': {
      telegram: {
        content: `<b>📝 订阅变更通知</b>

🔄 <b>{{name}}</b> 信息已更新

📅 下次续订: {{next_billing_date}}
💰 金额: {{amount}} {{currency}}
💳 支付方式: {{payment_method}}
📋 计划: {{plan}}

变更已生效。`
      },
      email: {
        subject: '订阅变更通知 - {{name}}',
        content: `您好，

您的订阅服务 "{{name}}" 信息已更新。

订阅详情：
- 服务名称：{{name}}
- 下次续订：{{next_billing_date}}
- 续订金额：{{amount}} {{currency}}
- 支付方式：{{payment_method}}
- 订阅计划：{{plan}}

变更已生效。

谢谢！`
      }
    },
    'en': {
      telegram: {
        content: `<b>📝 Subscription Change Notification</b>

🔄 <b>{{name}}</b> information updated

📅 Next renewal: {{next_billing_date}}
💰 Amount: {{amount}} {{currency}}
💳 Payment method: {{payment_method}}
📋 Plan: {{plan}}

Changes have taken effect.`
      },
      email: {
        subject: 'Subscription Change Notification - {{name}}',
        content: `Hello,

Your subscription service "{{name}}" information has been updated.

Subscription Details:
- Service Name: {{name}}
- Next Renewal: {{next_billing_date}}
- Renewal Amount: {{amount}} {{currency}}
- Payment Method: {{payment_method}}
- Subscription Plan: {{plan}}

Changes have taken effect.

Thank you!`
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
function getTemplate(notificationType, language = 'zh-CN', channel = 'telegram') {
  const typeTemplates = NOTIFICATION_TEMPLATES[notificationType];
  if (!typeTemplates) {
    return null;
  }

  // Try to get the template in the specified language
  let langTemplates = typeTemplates[language];
  if (!langTemplates) {
    // Language fallback mechanism
    const fallbackLanguages = ['en', 'zh-CN'];
    for (const fallbackLang of fallbackLanguages) {
      if (fallbackLang !== language && typeTemplates[fallbackLang]) {
        langTemplates = typeTemplates[fallbackLang];
        console.log(`Template fallback: ${language} -> ${fallbackLang} for ${notificationType}`);
        break;
      }
    }
  }

  if (!langTemplates) {
    return null;
  }

  const channelTemplate = langTemplates[channel];
  if (!channelTemplate) {
    return null;
  }

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
function getSupportedChannels(notificationType, language = 'zh-CN') {
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
