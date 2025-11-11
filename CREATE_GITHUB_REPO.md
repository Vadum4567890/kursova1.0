# Створення репозиторію на GitHub

## Назва репозиторію: `kursova1.0`

## Крок 1: Створення репозиторію на GitHub

1. Перейдіть на [GitHub.com](https://github.com) та увійдіть у свій акаунт

2. Натисніть кнопку **"+"** в правому верхньому куті → **"New repository"**

3. Заповніть форму:
   ```
   Repository name: kursova1.0
   Description: Система прокату автомобілів - курсовий проект
   Visibility: Public (або Private - на ваш вибір)
   ```

4. **ВАЖЛИВО**: НЕ створюйте:
   - ❌ README.md (він вже є в проекті)
   - ❌ .gitignore (він вже є в проекті)
   - ❌ LICENSE (якщо не потрібен)

5. Натисніть **"Create repository"**

## Крок 2: Підключення локального репозиторію до GitHub

Після створення репозиторію GitHub покаже інструкції. Виконайте наступні команди:

### Варіант 1: Якщо ви ще не створили репозиторій на GitHub

```powershell
# Перейдіть в папку проекту
cd C:\Users\meuf\source\repos\kursova1.0

# Додайте remote репозиторій (замініть YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/kursova1.0.git

# Перевірте, що remote додано
git remote -v

# Змініть назву гілки на main (якщо потрібно)
git branch -M main

# Завантажте код на GitHub
git push -u origin main
```

### Варіант 2: Якщо репозиторій вже створено на GitHub

GitHub покаже вам команди після створення. Вони будуть виглядати так:

```powershell
cd C:\Users\meuf\source\repos\kursova1.0
git remote add origin https://github.com/YOUR_USERNAME/kursova1.0.git
git branch -M main
git push -u origin main
```

## Крок 3: Перевірка

1. Перейдіть на сторінку вашого репозиторію: `https://github.com/YOUR_USERNAME/kursova1.0`
2. Переконайтеся, що всі файли завантажені
3. Перевірте, що README.md відображається правильно

## Приклад повної команди (замініть YOUR_USERNAME):

```powershell
cd C:\Users\meuf\source\repos\kursova1.0
git remote add origin https://github.com/YOUR_USERNAME/kursova1.0.git
git branch -M main
git push -u origin main
```

## Якщо виникли проблеми:

### Помилка: "remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/kursova1.0.git
```

### Помилка автентифікації
- Використовуйте Personal Access Token замість пароля
- Або налаштуйте SSH ключі

### Помилка: "failed to push"
```powershell
# Спробуйте з force (обережно!)
git push -u origin main --force
```

---

**Після створення репозиторію оновіть README.md, замінивши YOUR_USERNAME на ваш GitHub username!**

