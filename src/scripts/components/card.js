import { deleteCardApi } from "./api.js";


// card.js
import { changeLikeCardStatus } from "./api.js";

export const likeCard = (likeButton, cardId, userId, likeCountElement) => {
  // Проверяем, есть ли уже лайк пользователя
  const isLiked = likeButton.classList.contains("card__like-button_is-active");
  
  // Отправляем запрос на сервер (обратный: если есть лайк - удаляем, если нет - ставим)
  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      // Переключаем класс кнопки лайка
      likeButton.classList.toggle("card__like-button_is-active");
      
      if (likeCountElement) {
        likeCountElement.textContent = updatedCard.likes.length;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

export const deleteCard = (cardElement, id) => {

  deleteCardApi({
    _id: id,
  })
    .then((card) => {
      cardElement.remove();
    })
    .catch((err) => {
      console.log(err);
    });
};

const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

export const createCardElement = (
  data,
  { onPreviewPicture, onLikeIcon, onDeleteCard, currentUserId }
) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const cardImage = cardElement.querySelector(".card__image");
  const likeCountElement = cardElement.querySelector(".card__like-count");

  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardElement.querySelector(".card__title").textContent = data.name;


  if (likeCountElement) {
    likeCountElement.textContent = data.likes?.length || 0;
  }
  
  // Проверяем, есть ли лайк текущего пользователя
  const isLiked = data.likes && data.likes.some(like => like._id === currentUserId);
  if (isLiked) {
    likeButton.classList.add("card__like-button_is-active");
  }

  // Обработчик лайка
  if (onLikeIcon) {
    likeButton.addEventListener("click", () => onLikeIcon(likeButton, data._id, currentUserId, likeCountElement));
  }

  if (onDeleteCard) {
    deleteButton.addEventListener("click", () => onDeleteCard(cardElement, data._id));
  } else {
    deleteButton.style.display = "none";
  }

  if (onPreviewPicture) {
    cardImage.addEventListener("click", () => onPreviewPicture({name: data.name, link: data.link}));
  }

  return cardElement;
};
