const ensureTenancy = (req, res, next) => {
  if (!req.user || !req.user.organization_id) {
    return res.status(401).json({ error: 'Organization context required' });
  }
  
  req.tenancy = {
    organization_id: req.user.organization_id
  };
  
  next();
};

module.exports = { ensureTenancy };
