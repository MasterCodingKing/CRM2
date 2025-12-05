const { User, Organization, Pipeline } = require('../models');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const register = async (req, res, next) => {
  try {
    const { email, password, organization_name, first_name, last_name } = req.body;

    // Validate required fields
    if (!email || !password || !organization_name) {
      return res.status(400).json({ error: 'Email, password, and organization name are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create organization
    const organization = await Organization.create({
      name: organization_name,
      status: 'active',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
    });

    // Create user as admin
    const user = await User.create({
      organization_id: organization.id,
      email,
      password_hash: password,
      first_name,
      last_name,
      role: 'admin',
      is_active: true
    });

    // Create default pipeline
    await Pipeline.create({
      organization_id: organization.id,
      name: 'Default Sales Pipeline',
      is_default: true,
      stages: [
        { id: 1, name: 'Lead', order: 0, probability: 10 },
        { id: 2, name: 'Qualified', order: 1, probability: 25 },
        { id: 3, name: 'Proposal', order: 2, probability: 50 },
        { id: 4, name: 'Negotiation', order: 3, probability: 75 },
        { id: 5, name: 'Closed Won', order: 4, probability: 100 }
      ]
    });

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      organization_id: user.organization_id,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      organization_id: user.organization_id
    });

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization: {
          id: organization.id,
          name: organization.name,
          plan: organization.plan
        }
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Organization }]
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await user.update({ last_login_at: new Date() });

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      organization_id: user.organization_id,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      organization_id: user.organization_id
    });

    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization: {
          id: user.Organization.id,
          name: user.Organization.name,
          plan: user.Organization.plan
        }
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Organization }],
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        avatar_url: user.avatar_url,
        organization: {
          id: user.Organization.id,
          name: user.Organization.name,
          plan: user.Organization.plan,
          status: user.Organization.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
