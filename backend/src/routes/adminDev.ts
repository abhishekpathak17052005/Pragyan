import { Router, Request, Response } from 'express';
import adminDevController from '@/controllers/adminDev';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const router = Router();

// Development-only routes - do not mount in production
router.get('/summary', adminDevController.getDevSummary);

// Fix user account status (development only)
router.post('/fix-user-status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, accountStatus, userRole } = req.body;
    
    if (!email) {
      res.status(400).json({ success: false, message: "Email required" });
      return;
    }

    const updates: any = {};
    if (accountStatus) updates.accountStatus = accountStatus;
    if (userRole) updates.userRole = userRole;

    const user = await prisma.user.update({
      where: { email },
      data: updates,
    });

    res.json({
      success: true,
      message: "User updated",
      data: {
        email: user.email,
        accountStatus: user.accountStatus,
        userRole: user.userRole,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Error updating user",
    });
  }
});

// Create test user (development only)
router.post('/create-test-user', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, userRole } = req.body;
    
    if (!email || !password || !userRole) {
      res.status(400).json({ 
        success: false, 
        message: "Email, password, and userRole are required" 
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ 
        success: false, 
        message: "User already exists" 
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        fullName: email.split('@')[0],
        password: passwordHash,
        userRole,
        role: userRole.toLowerCase(),
        accountStatus: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Test user created",
      data: {
        email: user.email,
        password: password,
        userRole: user.userRole,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Error creating user",
    });
  }
});

export default router;
