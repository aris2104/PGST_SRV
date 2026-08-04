from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    """
    Manager custom : les servants se connectent avec un matricule
    (ex: SRV-AriskPes) et non un email, comme vu dans la maquette de connexion.
    """

    def create_user(self, matricule, password=None, **extra_fields):
        if not matricule:
            raise ValueError("Le matricule est obligatoire.")
        user = self.model(matricule=matricule, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, matricule, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError("Le superuser doit avoir is_staff=True.")
        if extra_fields.get('is_superuser') is not True:
            raise ValueError("Le superuser doit avoir is_superuser=True.")

        return self.create_user(matricule, password, **extra_fields)
