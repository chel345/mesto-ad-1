/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import { createCardElement, deleteCard, likeCard } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { getUserInfo, getCardList , setUserInfo, setUserAvatar, addCard } from "./components/api.js";
import { enableValidation, clearValidation } from "./components/validation.js";

let userId = null;

// Настройки валидации
const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

// Включение валидации
enableValidation(validationSettings);

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

// DOM узлы для статистики
const infoModalWindow = document.querySelector(".popup_type_info");
const infoTitle = infoModalWindow.querySelector(".popup__title");
const infoList = infoModalWindow.querySelector(".popup__info");
const infoText = infoModalWindow.querySelector(".popup__text");
const infoUsersList = infoModalWindow.querySelector(".popup__list");
const logo = document.querySelector(".header__logo");

// шаблоны
const infoDefinitionTemplate = document.getElementById("popup-info-definition-template");
const infoUserPreviewTemplate = document.getElementById("popup-info-user-preview-template");



// Функция для создания элемента статистики
const createInfoItem = (term, description) => {
  const template = infoDefinitionTemplate.content.cloneNode(true);
  const termElement = template.querySelector(".popup__info-term");
  const descriptionElement = template.querySelector(".popup__info-description");
  
  termElement.textContent = term;
  descriptionElement.textContent = description;
  
  return template;
};

// Функция для создания элемента списка пользователей
const createUserBadge = (userName) => {
  const template = infoUserPreviewTemplate.content.cloneNode(true);
  const badge = template.querySelector(".popup__list-item");
  badge.textContent = `${userName}`;
  return template;
};

// Функция открытия статистики
const openStatisticsModal = () => {
  // Показываем состояние загрузки
  infoTitle.textContent = "Загрузка статистики...";
  infoList.innerHTML = "";
  infoUsersList.innerHTML = "";
  infoText.textContent = "";
  
  openModalWindow(infoModalWindow);
  
  // Получаем карточки с сервера
  getCardList()
    .then((cards) => {
      // Статистика по пользователям
      const userStats = new Map(); // { userId: { name, totalLikes, cardsCount } }
      let totalLikes = 0;
      let champion = null;
      let maxLikes = 0;
      
      // Анализируем каждую карточку
      cards.forEach((card) => {
        const likesCount = card.likes?.length || 0;
        totalLikes += likesCount;
        
        // Статистика по владельцу карточки
        const ownerId = card.owner._id;
        const ownerName = card.owner.name;
        
        if (!userStats.has(ownerId)) {
          userStats.set(ownerId, {
            name: ownerName,
            totalLikes: likesCount,
            cardsCount: 1
          });
        } else {
          const user = userStats.get(ownerId);
          user.totalLikes += likesCount;
          user.cardsCount++;
        }
      });
      
      // Находим чемпиона по лайкам
      userStats.forEach((user, userId) => {
        if (user.totalLikes > maxLikes) {
          maxLikes = user.totalLikes;
          champion = user;
        }
      });
      
      // Заголовок окна
      infoTitle.textContent = "Статистика карточек";
      infoList.innerHTML = "";
      
      // Всего пользователей
      infoList.appendChild(createInfoItem("Всего пользователей:", userStats.size));
      // Всего лайков
      infoList.appendChild(createInfoItem("Всего лайков:", totalLikes));
      // Максимально лайков от одного
      if (champion) {
        infoList.appendChild(createInfoItem("Максимально лайков от одного:", champion.totalLikes));
        // Чемпион лайков
        infoList.appendChild(createInfoItem("Чемпион лайков:", champion.name));
      }
      
      // Заполняем список популярных карточек
      infoText.textContent = "Популярные карточки:";
      infoUsersList.innerHTML = "";
      
      // Сортируем карточки по количеству лайков (от большего к меньшему)
      const sortedCards = [...cards].sort((a, b) => {
        const likesA = a.likes?.length || 0;
        const likesB = b.likes?.length || 0;
        return likesB - likesA;
      });
      
      const topCards = sortedCards.slice(0, 3);
      
      topCards.forEach((card, index) => {
        const likesCount = card.likes?.length || 0;
        const template = infoUserPreviewTemplate.content.cloneNode(true);
        const listItem = template.querySelector(".popup__list-item");
        
        let cardName = card.name;
        if (cardName.length > 30) {
          cardName = cardName.substring(0, 27) + "...";
        }
        
        listItem.textContent = `${cardName}`;
        
        infoUsersList.appendChild(template);
      });
      
      // Если нет карточек
      if (topCards.length === 0) {
        const template = infoUserPreviewTemplate.content.cloneNode(true);
        const listItem = template.querySelector(".popup__list-item");
        listItem.textContent = "Нет карточек";
        listItem.style.fontStyle = "italic";
        infoUsersList.appendChild(template);
      }
    })
    .catch((err) => {
      console.error(err);
    });
};

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();

  const submitButton = evt.submitter;
  const originalButtonText = submitButton.textContent;
  submitButton.textContent = "Сохранение...";
  submitButton.disabled = true;

  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      // Код отвечающий за обновление данных на странице
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    });
};

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();

  const submitButton = evt.submitter;
  const originalButtonText = submitButton.textContent;
  submitButton.textContent = "Сохранение...";
  submitButton.disabled = true;

  setUserAvatar({
    avatar: avatarInput.value,
  })
    .then((userData) => {
      // Код отвечающий за обновление данных на странице
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = evt.submitter;
  const originalButtonText = submitButton.textContent;
  submitButton.textContent = "Сохранение...";
  submitButton.disabled = true;

  addCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((newCard) => {
        placesWrap.prepend(
          createCardElement(newCard, {
            onPreviewPicture: handlePreviewPicture,
            onLikeIcon: likeCard,
            onDeleteCard: deleteCard,
            currentUserId: userId,
          }));
        closeModalWindow(cardFormModalWindow);
        cardForm.reset();
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    });
};

// EventListeners
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);
logo.addEventListener("click", openStatisticsModal);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

//настраиваем обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

const shouldShowTrashFor = (card, userId) => {
  if (card.owner._id !== userId) {
    return null;
  }
  return deleteCard;
}

const update = () => {
  Promise.all([getCardList(), getUserInfo()])
    .then(([cards, userData]) => {
      userId = userData._id

      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      
      cards.forEach((data) => {
        placesWrap.append(
          createCardElement(data, {
            onPreviewPicture: handlePreviewPicture,
            onLikeIcon: likeCard,
            onDeleteCard: shouldShowTrashFor(data, userId),
            currentUserId: userId,
          })
        );
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

update();