const Joi = require('joi');

// Generic validation middleware
function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map(d => ({ field: d.path.join('.'), message: d.message }));
      return res.status(400).json({ success: false, error: 'Validation failed', details });
    }
    req[property] = value;
    next();
  };
}

// ── Schemas ──────────────────────────────────────────────

const schemas = {
  // Auth
  login: Joi.object({
    email: Joi.string().email().required().messages({ 'string.email': 'Valid email is required', 'any.required': 'Email is required' }),
    password: Joi.string().min(6).required().messages({ 'string.min': 'Password must be at least 6 characters', 'any.required': 'Password is required' }),
  }),

  // Account
  account: Joi.object({
    company_name: Joi.string().max(255).required(),
    industry: Joi.string().max(100).allow('', null),
    country: Joi.string().max(100).allow('', null),
    city: Joi.string().max(100).allow('', null),
    website: Joi.string().uri().allow('', null).messages({ 'string.uri': 'Invalid URL format' }),
    phone: Joi.string().max(50).allow('', null),
    employees: Joi.number().integer().min(0).allow(null),
    annual_revenue: Joi.number().min(0).allow(null),
    notes: Joi.string().allow('', null),
  }),

  // Contact
  contact: Joi.object({
    account_id: Joi.number().integer().required(),
    first_name: Joi.string().max(100).required(),
    last_name: Joi.string().max(100).required(),
    email: Joi.string().email().allow('', null),
    phone: Joi.string().max(50).allow('', null),
    position: Joi.string().max(100).allow('', null),
    department: Joi.string().max(100).allow('', null),
  }),

  // Lead
  lead: Joi.object({
    company_name: Joi.string().max(255).required(),
    contact_name: Joi.string().max(255).allow('', null),
    email: Joi.string().email().allow('', null).messages({ 'string.email': 'Invalid email format' }),
    phone: Joi.string().max(50).allow('', null),
    source: Joi.string().max(100).allow('', null),
    status: Joi.string().valid('New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost').default('New'),
    score: Joi.number().integer().min(0).max(100).default(0),
    notes: Joi.string().allow('', null),
  }),

  // Opportunity
  opportunity: Joi.object({
    account_id: Joi.number().integer().allow(null),
    contact_id: Joi.number().integer().allow(null),
    name: Joi.string().max(255).required(),
    description: Joi.string().allow('', null),
    value: Joi.number().min(0).default(0),
    probability: Joi.number().integer().min(0).max(100).default(0),
    stage: Joi.string().valid('Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost').default('Discovery'),
    expected_close_date: Joi.date().iso().allow(null),
    notes: Joi.string().allow('', null),
  }),

  // Activity
  activity: Joi.object({
    account_id: Joi.number().integer().allow(null),
    contact_id: Joi.number().integer().allow(null),
    opportunity_id: Joi.number().integer().allow(null),
    type: Joi.string().valid('Call', 'Email', 'Meeting', 'Site Visit', 'WhatsApp', 'Note', 'Other').required(),
    subject: Joi.string().max(255).required(),
    description: Joi.string().allow('', null),
    date: Joi.date().iso().allow(null),
    duration: Joi.number().integer().min(0).allow(null),
  }),

  // Task
  task: Joi.object({
    account_id: Joi.number().integer().allow(null),
    contact_id: Joi.number().integer().allow(null),
    opportunity_id: Joi.number().integer().allow(null),
    title: Joi.string().max(255).required(),
    description: Joi.string().allow('', null),
    due_date: Joi.date().iso().allow(null),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent').default('Medium'),
    status: Joi.string().valid('Not Started', 'In Progress', 'Completed', 'Cancelled').default('Not Started'),
    assigned_to: Joi.string().max(100).allow('', null),
  }),

  // Quote
  quote: Joi.object({
    account_id: Joi.number().integer().allow(null),
    opportunity_id: Joi.number().integer().allow(null),
    quote_no: Joi.string().max(50).allow('', null),
    amount: Joi.number().min(0).default(0),
    discount: Joi.number().min(0).max(100).default(0),
    tax: Joi.number().min(0).default(0),
    total: Joi.number().min(0).default(0),
    status: Joi.string().valid('Draft', 'Sent', 'Accepted', 'Rejected').default('Draft'),
    valid_until: Joi.date().iso().allow(null),
    notes: Joi.string().allow('', null),
  }),

  // Order
  order: Joi.object({
    account_id: Joi.number().integer().allow(null),
    opportunity_id: Joi.number().integer().allow(null),
    quote_id: Joi.number().integer().allow(null),
    order_no: Joi.string().max(50).allow('', null),
    amount: Joi.number().min(0).default(0),
    status: Joi.string().valid('Pending', 'Confirmed', 'Delivered', 'Cancelled').default('Pending'),
    delivery_date: Joi.date().iso().allow(null),
    notes: Joi.string().allow('', null),
  }),

  // Product
  product: Joi.object({
    name: Joi.string().max(255).required(),
    sku: Joi.string().max(100).required(),
    category: Joi.string().max(100).allow('', null),
    cost: Joi.number().min(0).default(0),
    selling_price: Joi.number().min(0).default(0),
    stock: Joi.number().integer().min(0).default(0),
    unit: Joi.string().max(50).allow('', null),
  }),

  // Case
  kase: Joi.object({
    account_id: Joi.number().integer().allow(null),
    contact_id: Joi.number().integer().allow(null),
    case_no: Joi.string().max(50).allow('', null),
    subject: Joi.string().max(255).required(),
    description: Joi.string().allow('', null),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent').default('Medium'),
    status: Joi.string().valid('New', 'In Progress', 'Resolved', 'Closed').default('New'),
    resolution: Joi.string().allow('', null),
  }),

  // Document
  document: Joi.object({
    account_id: Joi.number().integer().allow(null),
    opportunity_id: Joi.number().integer().allow(null),
    name: Joi.string().max(255).required(),
    file_path: Joi.string().max(500).allow('', null),
    file_size: Joi.number().integer().min(0).allow(null),
    file_type: Joi.string().max(100).allow('', null),
    category: Joi.string().max(100).allow('', null),
  }),
};

module.exports = { validate, schemas };
