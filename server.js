// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

// Import de la connexion PostgreSQL
const { pool } = require('./db');

// Import des fonctions d'auth
const { registerUser, loginUser } = require('./auth');

// Import des routes
const clientsRoutes = require('./clients');
const productRoutes = require('./products');
const ventesRoutes = require('./ventes');
const reportsRouter = require('./reports');
const returnsRouter = require('./returns');
const remplacerRouter = require('./remplacements');
const fournisseursRoutes = require('./fournisseurs');
const facturesRoutes = require('./factures');
const specialOrdersRoutes = require('./specialOrders');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS dynamique : accepte local + Railway (ajoute ton vrai domaine frontend)
const allowedOrigins = [
  'http://localhost:5173',
  'https://bago-front-production.up.railway.app' // Mettez ici l'URL de votre frontend déployé
];


app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les outils comme Postman ou accès direct sans origin
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Accès bloqué par la politique CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

/* --- ROUTES --- */

// Authentification
app.post('/api/login', loginUser);
app.post('/api/register', registerUser);

// Ressources
app.use('/api/clients', clientsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/ventes', ventesRoutes);
app.use('/api/reports', reportsRouter);
app.use('/api/returns', returnsRouter);
app.use('/api/remplacements', remplacerRouter);
app.use('/api/fournisseurs', fournisseursRoutes);
app.use('/api/factures', facturesRoutes);
app.use('/api/special-orders', specialOrdersRoutes);

// Route GET pour les bénéfices
app.get('/api/benefices', async (req, res) => {
  try {
    let query = `
      SELECT
          vi.id AS vente_item_id,
          vi.marque,
          vi.modele,
          vi.stockage,
          vi.type,
          vi.type_carton,
          vi.imei,
          vi.prix_unitaire_achat,
          vi.prix_unitaire_vente,
          vi.quantite_vendue,
          (vi.prix_unitaire_vente - vi.prix_unitaire_achat) AS benefice_unitaire_produit,
          (vi.quantite_vendue * (vi.prix_unitaire_vente - vi.prix_unitaire_achat)) AS benefice_total_par_ligne,
          v.date_vente
      FROM
          vente_items vi
      JOIN
          ventes v ON vi.vente_id = v.id
      JOIN
          factures f ON v.id = f.vente_id
      WHERE
          vi.statut_vente = 'actif'
          AND f.statut_facture = 'payee_integralement'
    `;

    const queryParams = [];
    let paramIndex = 1;

    const { date } = req.query;

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Format de date invalide. Utilisez YYYY-MM-DD.' });
      }

      query += ` AND DATE(v.date_vente) = $${paramIndex}`;
      queryParams.push(date);
      paramIndex++;
    }

    query += ` ORDER BY v.date_vente DESC;`;

    const itemsResult = await pool.query(query, queryParams);
    const soldItems = itemsResult.rows;

    let totalBeneficeGlobal = 0;
    soldItems.forEach(item => {
      totalBeneficeGlobal += parseFloat(item.benefice_total_par_ligne);
    });

    res.json({
      sold_items: soldItems,
      total_benefice_global: parseFloat(totalBeneficeGlobal)
    });

  } catch (err) {
    console.error('Erreur lors du calcul des bénéfices:', err);
    res.status(500).json({ error: 'Erreur interne du serveur lors du calcul des bénéfices.' });
  }
});

/* --- DÉMARRAGE DU SERVEUR --- */
app.listen(PORT, () => {
  console.log('✅ Connexion à la base de données réussie');
  console.log(`🚀 Serveur backend lancé sur le port ${PORT}`);
});
