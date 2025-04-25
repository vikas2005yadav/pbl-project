const express = require('express');
const router = express.Router();
const { Pump } = require('../models');
const auth = require('../middleware/auth');

// Get all pumps
router.get('/', async (req, res) => {
  try {
    const pumps = await Pump.findAll({
      where: { status: 'active' }
    });
    res.json(pumps);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pumps' });
  }
});

// Get single pump
router.get('/:id', async (req, res) => {
  try {
    const pump = await Pump.findByPk(req.params.id);
    if (!pump) {
      return res.status(404).json({ message: 'Pump not found' });
    }
    res.json(pump);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pump' });
  }
});

// Create pump (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const pump = await Pump.create(req.body);
    res.status(201).json(pump);
  } catch (error) {
    res.status(500).json({ message: 'Error creating pump' });
  }
});

// Update pump (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const pump = await Pump.findByPk(req.params.id);
    if (!pump) {
      return res.status(404).json({ message: 'Pump not found' });
    }

    await pump.update(req.body);
    res.json(pump);
  } catch (error) {
    res.status(500).json({ message: 'Error updating pump' });
  }
});

// Delete pump (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const pump = await Pump.findByPk(req.params.id);
    if (!pump) {
      return res.status(404).json({ message: 'Pump not found' });
    }

    await pump.destroy();
    res.json({ message: 'Pump deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting pump' });
  }
});

module.exports = router; 