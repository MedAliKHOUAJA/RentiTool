// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { requireAdmin } from '@/server/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Retourner l'erreur d'authentification
    }

    // Récupérer tous les utilisateurs (sauf le superadmin)
    const result = await db.query(
      `SELECT u."userId", u."FirstName", u."LastName", u."Email", u."Phone", 
              u."RoleId", u."CreatedAt", u."ProfileImage",
              l."Governorate", l."Delegation", l."Postalcode"
       FROM "User" u
       LEFT JOIN "Locations" l ON u."LocationId" = l."LocationId"
       WHERE u."RoleId" != 'superadmin'
       ORDER BY u."CreatedAt" DESC`
    );

    const users = result.rows.map(user => ({
      userId: user.userId,
      firstName: user.FirstName,
      lastName: user.LastName,
      email: user.Email,
      phone: user.Phone,
      role: user.RoleId,
      createdAt: user.CreatedAt,
      profileImage: user.ProfileImage,
      location: {
        governorate: user.Governorate,
        delegation: user.Delegation,
        postalCode: user.Postalcode
      }
    }));

    return NextResponse.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur lors de la récupération des utilisateurs' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId, role, firstName, lastName, email, phone } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ 
        error: 'userId et role sont requis' 
      }, { status: 400 });
    }

    // Vérifier que le rôle est valide
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: 'Rôle invalide. Les rôles valides sont: user, admin' 
      }, { status: 400 });
    }

    // Mettre à jour l'utilisateur
    const result = await db.query(
      `UPDATE "User" 
       SET "RoleId" = $1, "FirstName" = $2, "LastName" = $3, "Email" = $4, "Phone" = $5
       WHERE "userId" = $6 AND "RoleId" != 'superadmin'
       RETURNING "userId", "FirstName", "LastName", "Email", "Phone", "RoleId"`,
      [role, firstName, lastName, email, phone, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Utilisateur non trouvé ou non autorisé' 
      }, { status: 404 });
    }

    const updatedUser = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user: {
        userId: updatedUser.userId,
        firstName: updatedUser.FirstName,
        lastName: updatedUser.LastName,
        email: updatedUser.Email,
        phone: updatedUser.Phone,
        role: updatedUser.RoleId
      }
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour utilisateur:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur lors de la mise à jour de l\'utilisateur' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId est requis' 
      }, { status: 400 });
    }

    // Supprimer l'utilisateur (mais pas le superadmin)
    const result = await db.query(
      `DELETE FROM "User" 
       WHERE "userId" = $1 AND "RoleId" != 'superadmin'
       RETURNING "userId"`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Utilisateur non trouvé ou non autorisé' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression utilisateur:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur lors de la suppression de l\'utilisateur' 
    }, { status: 500 });
  }
}