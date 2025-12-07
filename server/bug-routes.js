// server/bug-routes.js - Routes pour le système de report de bugs

const express = require('express');
const BugReport = require('../utils/BugReport');
const emailService = require('./email-service');

const router = express.Router();

/**
 * POST /api/bugs - Recevoir un nouveau rapport de bug
 */
router.post('/', async (req, res) => {
    try {
        const {
            description,
            email,
            screenshot,
            logs,
            userAgent,
            timestamp,
            url,
            viewport
        } = req.body;

        // Validation basique
        if (!description || description.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'La description du bug est requise'
            });
        }

        // Créer le rapport
        const bugReport = new BugReport({
            description: description.trim().substring(0, 5000),
            email: email && email.trim() ? email.trim() : null,
            screenshot: screenshot ? screenshot.substring(0, 5000000) : null,  // Limiter la taille
            logs: logs ? logs.slice(0, 100) : [],  // Limiter le nombre de logs
            userAgent,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            url,
            viewport,
            status: 'new'
        });

        // Sauvegarder dans la base de données
        await bugReport.save();
        console.log(`📝 Bug report sauvegardé: ${bugReport._id}`);

        // Envoyer la notification par email
        try {
            await emailService.sendBugNotification(bugReport);
        } catch (emailError) {
            console.error('⚠️  Erreur email (bug sauvegardé quand même):', emailError.message);
        }

        // Envoyer un email de confirmation à l'utilisateur si email fourni
        if (email) {
            try {
                await emailService.sendConfirmationEmail(email, bugReport._id);
            } catch (confirmationError) {
                console.error('⚠️  Erreur email de confirmation:', confirmationError.message);
            }
        }

        res.json({
            success: true,
            bugId: bugReport._id,
            message: 'Merci pour votre rapport de bug!'
        });

    } catch (error) {
        console.error('❌ Erreur lors de la création du rapport de bug:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'envoi du rapport'
        });
    }
});

/**
 * GET /api/bugs - Récupérer tous les rapports (admin seulement)
 */
router.get('/', async (req, res) => {
    try {
        // TODO: Ajouter l'authentification admin
        const bugs = await BugReport.find()
            .sort({ timestamp: -1 })
            .limit(100);

        res.json({
            success: true,
            count: bugs.length,
            bugs
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des bugs:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération'
        });
    }
});

/**
 * GET /api/bugs/:id - Récupérer un rapport spécifique
 */
router.get('/:id', async (req, res) => {
    try {
        const bug = await BugReport.findById(req.params.id);

        if (!bug) {
            return res.status(404).json({
                success: false,
                error: 'Bug non trouvé'
            });
        }

        res.json({
            success: true,
            bug
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération du bug:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération'
        });
    }
});

/**
 * PATCH /api/bugs/:id - Mettre à jour le statut d'un bug (admin seulement)
 */
router.patch('/:id', async (req, res) => {
    try {
        // TODO: Ajouter l'authentification admin
        const { status, notes, assignedTo } = req.body;

        const bug = await BugReport.findByIdAndUpdate(
            req.params.id,
            {
                ...(status && { status }),
                ...(notes && { notes }),
                ...(assignedTo && { assignedTo })
            },
            { new: true }
        );

        if (!bug) {
            return res.status(404).json({
                success: false,
                error: 'Bug non trouvé'
            });
        }

        console.log(`✅ Bug ${req.params.id} mis à jour`);

        res.json({
            success: true,
            bug
        });
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du bug:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour'
        });
    }
});

/**
 * GET /api/bugs/stats/summary - Statistiques des bugs
 */
router.get('/stats/summary', async (req, res) => {
    try {
        const total = await BugReport.countDocuments();
        const byStatus = await BugReport.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const recent = await BugReport.find()
            .sort({ timestamp: -1 })
            .limit(5);

        res.json({
            success: true,
            stats: {
                total,
                byStatus: Object.fromEntries(byStatus.map(s => [s._id, s.count])),
                recent
            }
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des stats:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur'
        });
    }
});

module.exports = router;
