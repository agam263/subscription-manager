const { 
    getTemplate, 
    getSupportedLanguages, 
    getSupportedNotificationTypes, 
    getSupportedChannels 
} = require('../config/notificationTemplates');

/* * 
* Notification template controller 
* Provide template-related API endpoints */
class TemplateController {
    /* * 
* Get the list of supported languages */
    static getSupportedLanguages(req, res) {
        try {
            const languages = getSupportedLanguages();
            res.json({
                success: true,
                data: languages
            });
        } catch (error) {
            console.error('Error getting supported languages:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get supported languages'
            });
        }
    }

    /* * 
* Get the list of supported notification types */
    static getSupportedNotificationTypes(req, res) {
        try {
            const types = getSupportedNotificationTypes();
            res.json({
                success: true,
                data: types
            });
        } catch (error) {
            console.error('Error getting supported notification types:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get supported notification types'
            });
        }
    }

    /* * 
* Get the list of supported channels */
    static getSupportedChannels(req, res) {
        try {
            const { notificationType, language = 'zh-CN' } = req.query;
            
            if (!notificationType) {
                return res.status(400).json({
                    success: false,
                    error: 'notificationType is required'
                });
            }

            const channels = getSupportedChannels(notificationType, language);
            res.json({
                success: true,
                data: channels
            });
        } catch (error) {
            console.error('Error getting supported channels:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get supported channels'
            });
        }
    }

    /* * 
* Get a specific template */
    static getTemplate(req, res) {
        try {
            const { notificationType, language = 'zh-CN', channel = 'telegram' } = req.query;
            
            if (!notificationType) {
                return res.status(400).json({
                    success: false,
                    error: 'notificationType is required'
                });
            }

            const template = getTemplate(notificationType, language, channel);
            
            if (!template) {
                return res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            }

            res.json({
                success: true,
                data: template
            });
        } catch (error) {
            console.error('Error getting template:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get template'
            });
        }
    }

    /* * 
* Get overview information of all templates */
    static getTemplateOverview(req, res) {
        try {
            const types = getSupportedNotificationTypes();
            const languages = getSupportedLanguages();
            
            const overview = types.map(type => {
                const languageChannels = {};
                
                languages.forEach(lang => {
                    const channels = getSupportedChannels(type, lang);
                    if (channels.length > 0) {
                        languageChannels[lang] = channels;
                    }
                });
                
                return {
                    notificationType: type,
                    supportedLanguages: Object.keys(languageChannels),
                    languageChannels
                };
            });

            res.json({
                success: true,
                data: {
                    overview,
                    totalTypes: types.length,
                    totalLanguages: languages.length
                }
            });
        } catch (error) {
            console.error('Error getting template overview:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get template overview'
            });
        }
    }

    /* * 
* Preview template rendering results */
    static previewTemplate(req, res) {
        try {
            const { 
                notificationType, 
                language = 'zh-CN', 
                channel = 'telegram',
                sampleData = {}
            } = req.body;
            
            if (!notificationType) {
                return res.status(400).json({
                    success: false,
                    error: 'notificationType is required'
                });
            }

            const template = getTemplate(notificationType, language, channel);
            
            if (!template) {
                return res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            }

            // Template rendering using sample data or default data
            const defaultSampleData = {
                name: 'Netflix',
                plan: 'Premium',
                amount: '15.99',
                currency: 'USD',
                next_billing_date: '2024-01-15',
                payment_method: 'Credit Card',
                status: 'active',
                billing_cycle: 'monthly'
            };

            const templateData = { ...defaultSampleData, ...sampleData };
            
            // Simple template replacement
            let content = template.content_template;
            let subject = template.subject_template;
            
            Object.keys(templateData).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                content = content.replace(regex, templateData[key]);
                if (subject) {
                    subject = subject.replace(regex, templateData[key]);
                }
            });

            res.json({
                success: true,
                data: {
                    template,
                    renderedContent: content,
                    renderedSubject: subject,
                    sampleData: templateData
                }
            });
        } catch (error) {
            console.error('Error previewing template:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to preview template'
            });
        }
    }
}

module.exports = TemplateController;
