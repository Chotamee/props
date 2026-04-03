const API_URL = 'https://script.google.com/macros/s/AKfycbw6JcJLXzqYFmyfZmsFBc9Q0LAbYRc2IkM5PQAaPkneMtKtX3r92D5wpsqABzLlDTO8/exec';

// Global state variables
let publicationsCache = null;
let isLoginMode = true;
let userMethodologyProgress = {}; // Format: { "0": [true, false...], "1": [...] }
