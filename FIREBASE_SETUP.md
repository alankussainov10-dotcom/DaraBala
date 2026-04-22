# 🔥 Настройка Firebase для DaraBala

## Шаг 1: Создай проект на Firebase

1. Перейди на https://console.firebase.google.com/
2. Нажми **"Add project"** или **"Создать проект"**
3. Введи название: `DaraBala`
4. Отключи Google Analytics (не нужно для начала)
5. Нажми **"Create project"**

## Шаг 2: Добавь веб-приложение

1. В проекте нажми на иконку **Web** (`</>`)
2. Введи название приложения: `DaraBala Student`
3. Скопируй конфигурацию — она выглядит так:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD-XXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "darabala.firebaseapp.com",
  projectId: "darabala",
  storageBucket: "darabala.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## Шаг 3: Вставь конфиг в код

Открой файл `/workspace/student/index.html` и найди строку ~69:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD-YOUR-API-KEY-HERE",
  authDomain: "darabala.firebaseapp.com",
  projectId: "darabala",
  storageBucket: "darabala.appspot.com",
  messagingSenderId: "YOUR-SENDER-ID",
  appId: "YOUR-APP-ID"
};
```

**Замени значения на свои из Firebase Console!**

## Шаг 4: Включи Firestore Database

1. В Firebase Console перейди в **"Build"** → **"Firestore Database"**
2. Нажми **"Create database"**
3. Выбери **"Start in test mode"** (для разработки)
4. Выбери локацию: `europe-west` (ближе к Казахстану)
5. Нажми **"Enable"**

## Шаг 5: Включи Authentication (опционально)

1. В Firebase Console перейди в **"Build"** → **"Authentication"**
2. Нажми **"Get started"**
3. Включи **Google** провайдер:
   - Нажми на **"Google"**
   - Включи **"Enable"**
   - Укажи support email
   - Сохрани

## Шаг 6: Проверь работу

1. Открой консоль браузера (F12)
2. Зайди на сайт: `https://alankussainov10-dotcom.github.io/DaraBala/student/`
3. Должно появиться сообщение: `✅ Firebase initialized`

Если видишь `⚠️ Firebase not configured yet, using localStorage` — значит конфиг ещё не вставлен.

## Структура данных в Firestore

```
users/
  {userId}/
    name: "Алан"
    avatar: "bear"
    email: "user@gmail.com"
    progress/
      english/
        completed: ["mod_0", "mod_1"]
        xp: 150
        streak: 7
        lastActivity: timestamp
      cs/
        completed: ["mod_0"]
        xp: 50
        streak: 2
```

## Безопасность (Production Rules)

Когда будешь готов к продакшену, установи правила Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Готово! 🎉

Теперь прогресс учеников сохраняется в облаке и не теряется при смене устройства!
