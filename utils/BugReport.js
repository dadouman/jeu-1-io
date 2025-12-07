// utils/BugReport.js - Modèle MongoDB pour les rapports de bugs

const mongoose = require('mongoose');

const bugReportSchema = new mongoose.Schema({
    // Contenu du rapport
    description: {
        type: String,
        required: true,
        maxlength: 5000
    },
    
    // Contact utilisateur
    email: {
        type: String,
        default: null
    },
    
    // Données techniques
    screenshot: {
        type: String,  // Base64 encoded image
        default: null
    },
    
    logs: [{
        level: String,      // 'LOG', 'ERROR', 'WARN', 'INFO'
        timestamp: String,
        message: String
    }],
    
    userAgent: String,
    url: String,
    viewport: {
        width: Number,
        height: Number
    },
    
    // Métadonnées
    timestamp: {
        type: Date,
        default: Date.now
    },
    
    // Statut du bug
    status: {
        type: String,
        enum: ['new', 'acknowledged', 'investigating', 'fixed', 'wontfix'],
        default: 'new'
    },
    
    // Notes internes
    notes: String,
    
    // Administrateur qui a traité le bug
    assignedTo: {
        type: String,
        default: null
    }
});

// Index pour les recherches rapides
bugReportSchema.index({ timestamp: -1 });
bugReportSchema.index({ status: 1 });
bugReportSchema.index({ email: 1 });

const BugReport = mongoose.model('BugReport', bugReportSchema);

module.exports = BugReport;
