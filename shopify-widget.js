/**
 * SocialKonnect Admin Widget pour Shopify
 * Ce script est injecté dans l'interface d'administration Shopify
 */

(function () {
  // Configuration des logs de débogage
  const DEBUG = true;
  const logDebug = (message, data = null) => {
    if (!DEBUG) return;

    const timestamp = new Date().toISOString();
    const prefix = '[SocialKonnect Widget]';

    if (data) {
      console.log(`${prefix} ${timestamp} - ${message}`, data);
    } else {
      console.log(`${prefix} ${timestamp} - ${message}`);
    }
  };

  // Vérifier si nous sommes dans l'admin Shopify
const isShopifyAdmin =
  (window.location.hostname.includes('myshopify.com') || window.location.hostname.includes('admin.shopify.com')) &&
  (window.location.pathname.includes('/admin') || window.location.pathname.includes('/store/') || (window.Shopify && window.Shopify.Shop));

  logDebug('Initialisation du widget', {
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    isAdmin: isShopifyAdmin
  });

  if (!isShopifyAdmin) {
    logDebug("Ce script ne s'exécute que dans l'admin Shopify - Arrêt");
    return;
  }

  logDebug("Démarrage dans l'interface admin Shopify");

  // Détection du domaine de la boutique
  let shopDomain = '';
  try {
    if (window.Shopify && window.Shopify.shop) {
      shopDomain = window.Shopify.shop;
      logDebug(`Boutique détectée via window.Shopify.shop: ${shopDomain}`);
    } else if (window.location.hostname.includes('myshopify.com')) {
      shopDomain = window.location.hostname;
      logDebug(`Boutique détectée via hostname: ${shopDomain}`);
    }
    logDebug(`Boutique détectée: ${shopDomain}`);
  } catch (error) {
    logDebug('Erreur lors de la détection de la boutique', error);
  }

  // Détecter l'URL de l'API dynamiquement
  // Cette variable sera remplacée lors du déploiement
  const apiBaseUrl = '{{API_BASE_URL}}';
  const apiUrl = apiBaseUrl || 'http://localhost:5000/api';

  // Configuration du widget
  const config = {
    appName: 'SocialKonnect',
    appColor: '#3f51b5',
    apiUrl: apiUrl,
    shopDomain: shopDomain
  };

  logDebug('Configuration du widget', config);

  // CSS pour le widget
  const styles = `
    .sk-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 320px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif;
      z-index: 999999;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    .sk-widget.sk-collapsed {
      width: 60px;
      height: 60px!important;
      overflow: hidden;
    }
    .sk-header {
      background: ${config.appColor};
      color: white;
      padding: 14px 18px;
      font-weight: 500;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }
    .sk-content {
      padding: 18px;
      max-height: 400px;
      overflow-y: auto;
    }
    .sk-stat {
      margin-bottom: 18px;
      padding-bottom: 18px;
      border-bottom: 1px solid #f1f1f1;
    }
    .sk-stat-title {
      font-size: 14px;
      color: #637381;
      margin-bottom: 6px;
    }
    .sk-stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #212B36;
    }
    .sk-btn {
      background: ${config.appColor};
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      margin-top: 10px;
      width: 100%;
      transition: background-color 0.3s ease;
    }
    .sk-btn:hover {
      background-color: #303f9f;
    }
    .sk-footer {
      padding: 12px 15px;
      background: #f9f9f9;
      text-align: center;
      font-size: 12px;
      color: #637381;
    }
    .sk-toggle {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
    .sk-loading {
      text-align: center;
      padding: 20px 0;
      color: #637381;
    }
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
    .sk-loading {
      animation: pulse 1.5s infinite ease-in-out;
    }
  `;

  // Injecter le CSS
  logDebug('Injection des styles CSS');
  const styleEl = document.createElement('style');
  styleEl.innerHTML = styles;
  document.head.appendChild(styleEl);
  logDebug('Styles CSS injectés avec succès');

  // Créer le widget
  function createWidget() {
    logDebug("Création du widget dans l'interface admin");

    // Vérifier si le widget existe déjà
    if (document.querySelector('.sk-widget')) {
      logDebug('Widget déjà présent, évite la duplication');
      return;
    }

    const widget = document.createElement('div');
    widget.className = 'sk-widget';
    widget.innerHTML = `
      <div class="sk-header">
        <span>${config.appName}</span>
        <div class="sk-toggle">➖</div>
      </div>
      <div class="sk-content">
        <div class="sk-loading">Chargement des statistiques...</div>
        <div class="sk-stats" style="display: none;"></div>
      </div>
      <div class="sk-footer">
        Propulsé par SocialKonnect
      </div>
    `;

    logDebug('Ajout du widget au DOM');
    document.body.appendChild(widget);
    logDebug('Widget ajouté au DOM');

    // Fonction pour toggles le widget
    const header = widget.querySelector('.sk-header');
    const toggle = widget.querySelector('.sk-toggle');
    header.addEventListener('click', function () {
      logDebug("Clic sur l'en-tête du widget, basculement état");
      widget.classList.toggle('sk-collapsed');
      toggle.textContent = widget.classList.contains('sk-collapsed') ? '➕' : '➖';
      logDebug(`Widget est maintenant ${widget.classList.contains('sk-collapsed') ? 'réduit' : 'développé'}`);
    });

    // Charger les données
    loadData(widget);
  }

  // Charger les données depuis l'API
  function loadData(widget) {
    logDebug('Chargement des données');
    const statsContainer = widget.querySelector('.sk-stats');
    const loadingEl = widget.querySelector('.sk-loading');

    // Dans une version réelle, vous feriez un appel API vers votre backend
    try {
      // Pour le moment, on simule les données
      logDebug('Simulation du chargement des données (délai: 1.5s)');
      setTimeout(() => {
        logDebug("Données simulées prêtes, mise à jour de l'interface");
        loadingEl.style.display = 'none';
        statsContainer.style.display = 'block';

        // Données de démonstration
        const stats = [
          { title: 'Produits Partagés', value: '124' },
          { title: 'Vues Sociales', value: '3,456' },
          { title: 'Conversions Sociales', value: '28' }
        ];

        logDebug('Données de statistiques à afficher', stats);

        // Construire le HTML des statistiques
        let statsHTML = '';
        stats.forEach((stat) => {
          statsHTML += `
            <div class="sk-stat">
              <div class="sk-stat-title">${stat.title}</div>
              <div class="sk-stat-value">${stat.value}</div>
            </div>
          `;
        });

        // Ajouter un bouton pour accéder au dashboard
        const dashboardUrl = `${config.apiUrl}/shopify/dashboard`;
        logDebug(`Ajout du bouton vers le dashboard: ${dashboardUrl}`);
        statsHTML += `
          <button class="sk-btn" onclick="window.open('${dashboardUrl}', '_blank')">
            Voir Dashboard Complet
          </button>
        `;

        statsContainer.innerHTML = statsHTML;
        logDebug('Données chargées et affichées avec succès');
      }, 1500);
    } catch (error) {
      logDebug('Erreur lors du chargement des données', {
        message: error.message,
        stack: error.stack
      });

      loadingEl.style.display = 'none';
      statsContainer.style.display = 'block';
      statsContainer.innerHTML = `
        <div style="color: #d32f2f; text-align: center; padding: 20px 0;">
          Impossible de charger les données. Veuillez réessayer plus tard.
        </div>
        <button class="sk-btn" onclick="location.reload()">
          Réessayer
        </button>
      `;
    }
  }

  // Initialisation avec délai pour s'assurer que Shopify est complètement chargé
  logDebug("Planification de l'initialisation avec délai");
  setTimeout(() => {
    logDebug('Initialisation après délai');
    if (document.readyState === 'complete') {
      logDebug('Document déjà chargé, création immédiate');
      createWidget();
    } else {
      logDebug('En attente du chargement complet de la page');
      window.addEventListener('load', () => {
        logDebug('Événement de chargement déclenché, création du widget');
        createWidget();
      });
    }
  }, 1000);

  // Tenter également une initialisation immédiate
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    logDebug(`Initialisation immédiate (readyState: ${document.readyState})`);
    createWidget();
  }
})();
