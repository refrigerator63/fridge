import {
    initializeApp
} from
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
/* ==================================================
   Firebase
   ================================================== */
const firebaseConfig = {
    apiKey:
        "ここにAPIキー",
    authDomain:
        "ここにauthDomain",
    projectId:
        "ここにprojectId",
    storageBucket:
        "ここにstorageBucket",
    messagingSenderId:
        "ここにmessagingSenderId",
    appId:
        "ここにappId"
};
const firebaseApp =
    initializeApp(firebaseConfig);
const db =
    getFirestore(firebaseApp);
/* ==================================================
   状態
   ================================================== */
let currentUser =
    localStorage.getItem("fridgeUser");
let selectedStorage =
    "fridge";
let selectedBestBefore =
    null;
let selectedUseBy =
    null;
let editingDateType =
    null;
let deletingFood =
    null;
/* ==================================================
   ログイン
   ================================================== */
const loginScreen =
    document.getElementById(
        "loginScreen"
    );
const appScreen =
    document.getElementById(
        "app"
    );
const currentUserText =
    document.getElementById(
        "currentUser"
    );
const userButtons =
    document.querySelectorAll(
        ".user-button"
    );
userButtons.forEach(button => {
    button.addEventListener(
        "click",
        () => {
            userButtons.forEach(b => {
                b.classList.remove(
                    "selected"
                );
            });
            button.classList.add(
                "selected"
            );
            currentUser =
                button.dataset.user;
        }
    );
});
document
    .getElementById("loginButton")
    .addEventListener(
        "click",
        () => {
            if (!currentUser) {
                alert(
                    "名前を選択してください"
                );
                return;
            }
            localStorage.setItem(
                "fridgeUser",
                currentUser
            );
            showApp();
        }
    );
function showApp() {
    loginScreen.classList.add(
        "hidden"
    );
    appScreen.classList.remove(
        "hidden"
    );
    currentUserText.textContent =
        `ログイン中：${currentUser}`;
    startRealtimeListener();
}
if (currentUser) {
    showApp();
}
document
    .getElementById("logoutButton")
    .addEventListener(
        "click",
        () => {
            localStorage.removeItem(
                "fridgeUser"
            );
            location.reload();
        }
    );
/* ==================================================
   冷蔵庫 / 冷凍庫
   ================================================== */
const storageButtons =
    document.querySelectorAll(
        ".storage-button"
    );
storageButtons.forEach(button => {
    button.addEventListener(
        "click",
        () => {
            storageButtons.forEach(b => {
                b.classList.remove(
                    "selected"
                );
            });
            button.classList.add(
                "selected"
            );
            selectedStorage =
                button.dataset.storage;
            updateAddButton();
        }
    );
});
function updateAddButton() {
    const button =
        document.getElementById(
            "addButton"
        );
    if (
        selectedStorage ===
        "fridge"
    ) {
        button.textContent =
            "冷蔵庫に追加";
    } else {
        button.textContent =
            "冷凍庫に追加";
    }
}
/* ==================================================
   日付
   ================================================== */
function getDefaultDate() {
    const date =
        new Date();
    date.setHours(
        0,
        0,
        0,
        0
    );
    date.setDate(
        date.getDate() + 2
    );
    return date;
}
/* 日付モーダルを開く */
function openDateModal(type) {
    editingDateType =
        type;
    document.getElementById(
        "modalTitle"
    ).textContent =
        type === "bestBefore"
            ? "賞味期限"
            : "消費期限";
    let date = null;
    if (
        type === "bestBefore" &&
        selectedBestBefore
    ) {
        date =
            parseDate(
                selectedBestBefore
            );
    }
    if (
        type === "useBy" &&
        selectedUseBy
    ) {
        date =
            parseDate(
                selectedUseBy
            );
    }
    if (!date) {
        date =
            getDefaultDate();
    }
    createDateWheels(date);
    document
        .getElementById("dateModal")
        .classList.remove(
            "hidden"
        );
}
/* ==================================================
   日付ホイール作成
   ================================================== */
function createDateWheels(date) {
    const yearWheel =
        document.getElementById(
            "yearWheel"
        );
    const monthWheel =
        document.getElementById(
            "monthWheel"
        );
    const dayWheel =
        document.getElementById(
            "dayWheel"
        );
    yearWheel.innerHTML = "";
    monthWheel.innerHTML = "";
    dayWheel.innerHTML = "";
    const year =
        date.getFullYear();
    const month =
        date.getMonth() + 1;
    const day =
        date.getDate();
    /* 年 */
    for (
        let y = year - 5;
        y <= year + 10;
        y++
    ) {
        createWheelItem(
            yearWheel,
            y,
            `${y}年`
        );
    }
    /* 月 */
    for (
        let m = 1;
        m <= 12;
        m++
    ) {
        createWheelItem(
            monthWheel,
            m,
            `${m}月`
        );
    }
    /* 日 */
    const maxDay =
        new Date(
            year,
            month,
            0
        ).getDate();
    for (
        let d = 1;
        d <= maxDay;
        d++
    ) {
        createWheelItem(
            dayWheel,
            d,
            `${d}日`
        );
    }
    /*
     * CSSのpaddingによって
     * 端の項目も中央まで移動できる
     */
    requestAnimationFrame(() => {
        setWheelValue(
            yearWheel,
            year
        );
        setWheelValue(
            monthWheel,
            month
        );
        setWheelValue(
            dayWheel,
            day
        );
        updateAllSelected();
    });
}
/* ==================================================
   ホイール項目
   ================================================== */
function createWheelItem(
    wheel,
    value,
    text
) {
    const item =
        document.createElement(
            "div"
        );
    item.className =
        "wheel-item";
    item.dataset.value =
        value;
    item.textContent =
        text;
    wheel.appendChild(
        item
    );
}
/* ==================================================
   指定した値を中央に
   ================================================== */
function setWheelValue(
    wheel,
    value
) {
    const item =
        [...wheel.querySelectorAll(
            ".wheel-item"
        )]
            .find(
                item =>
                    Number(
                        item.dataset.value
                    ) === value
            );
    if (!item) return;
    wheel.scrollTop =
        item.offsetTop -
        wheel.clientHeight / 2 +
        item.offsetHeight / 2;
}
/* ==================================================
   中央の値を取得
   ================================================== */
function getCenteredValue(
    wheel
) {
    const items =
        [
            ...wheel.querySelectorAll(
                ".wheel-item"
            )
        ];
    const wheelRect =
        wheel.getBoundingClientRect();
    const center =
        wheelRect.top +
        wheelRect.height / 2;
    let closest = null;
    let minDistance =
        Infinity;
    items.forEach(item => {
        const rect =
            item.getBoundingClientRect();
        const itemCenter =
            rect.top +
            rect.height / 2;
        const distance =
            Math.abs(
                center -
                itemCenter
            );
        if (
            distance <
            minDistance
        ) {
            minDistance =
                distance;
            closest =
                item;
        }
    });
    if (!closest) {
        return null;
    }
    return Number(
        closest.dataset.value
    );
}
/* ==================================================
   選択中表示を更新
   ================================================== */
function updateSelected(
    wheel
) {
    const value =
        getCenteredValue(
            wheel
        );
    wheel
        .querySelectorAll(
            ".wheel-item"
        )
        .forEach(item => {
            item.classList.toggle(
                "selected",
                Number(
                    item.dataset.value
                ) === value
            );
        });
}
function updateAllSelected() {
    updateSelected(
        document.getElementById(
            "yearWheel"
        )
    );
    updateSelected(
        document.getElementById(
            "monthWheel"
        )
    );
    updateSelected(
        document.getElementById(
            "dayWheel"
        )
    );
}
/* ==================================================
   スクロール処理
   ================================================== */
function setupWheel(
    wheel
) {
    let timer = null;
    wheel.addEventListener(
        "scroll",
        () => {
            clearTimeout(timer);
            timer =
                setTimeout(() => {
                    updateSelected(
                        wheel
                    );
                }, 60);
        }
    );
}
setupWheel(
    document.getElementById(
        "yearWheel"
    )
);
setupWheel(
    document.getElementById(
        "monthWheel"
    )
);
setupWheel(
    document.getElementById(
        "dayWheel"
    )
);
/* ==================================================
   日付モーダル
   ================================================== */
document
    .getElementById(
        "bestBeforeButton"
    )
    .addEventListener(
        "click",
        () => {
            openDateModal(
                "bestBefore"
            );
        }
    );
document
    .getElementById(
        "useByButton"
    )
    .addEventListener(
        "click",
        () => {
            openDateModal(
                "useBy"
            );
        }
    );
document
    .getElementById(
        "closeModal"
    )
    .addEventListener(
        "click",
        closeDateModal
    );
function closeDateModal() {
    document
        .getElementById(
            "dateModal"
        )
        .classList.add(
            "hidden"
        );
}
/* 背景をタップ */
document
    .getElementById(
        "dateModal"
    )
    .addEventListener(
        "click",
        event => {
            if (
                event.target.id ===
                "dateModal"
            ) {
                closeDateModal();
            }
        }
    );
/* ==================================================
   日付確定
   ================================================== */
document
    .getElementById(
        "saveDate"
    )
    .addEventListener(
        "click",
        () => {
            const year =
                getCenteredValue(
                    document.getElementById(
                        "yearWheel"
                    )
                );
            const month =
                getCenteredValue(
                    document.getElementById(
                        "monthWheel"
                    )
                );
            const day =
                getCenteredValue(
                    document.getElementById(
                        "dayWheel"
                    )
                );
            if (
                year === null ||
                month === null ||
                day === null
            ) {
                return;
            }
            /*
             * その月に存在しない日を防ぐ
             */
            const maxDay =
                new Date(
                    year,
                    month,
                    0
                ).getDate();
            if (
                day > maxDay
            ) {
                alert(
                    `${month}月には${day}日はありません`
                );
                return;
            }
            const date =
                createDateString(
                    year,
                    month,
                    day
                );
            if (
                editingDateType ===
                "bestBefore"
            ) {
                selectedBestBefore =
                    date;
                document.getElementById(
                    "bestBeforeText"
                ).textContent =
                    formatJapaneseDate(
                        date
                    );
            }
            if (
                editingDateType ===
                "useBy"
            ) {
                selectedUseBy =
                    date;
                document.getElementById(
                    "useByText"
                ).textContent =
                    formatJapaneseDate(
                        date
                    );
            }
            closeDateModal();
        }
    );
/* ==================================================
   期限なし
   ================================================== */
document
    .getElementById(
        "clearDate"
    )
    .addEventListener(
        "click",
        () => {
            if (
                editingDateType ===
                "bestBefore"
            ) {
                selectedBestBefore =
                    null;
                document.getElementById(
                    "bestBeforeText"
                ).textContent =
                    "未設定";
            }
            if (
                editingDateType ===
                "useBy"
            ) {
                selectedUseBy =
                    null;
                document.getElementById(
                    "useByText"
                ).textContent =
                    "未設定";
            }
            closeDateModal();
        }
    );
/* ==================================================
   日付関数
   ================================================== */
function createDateString(
    year,
    month,
    day
) {
    return (
        `${year}-` +
        `${String(month).padStart(2, "0")}-` +
        `${String(day).padStart(2, "0")}`
    );
}
function parseDate(
    dateString
) {
    const [
        year,
        month,
        day
    ] =
        dateString
            .split("-")
            .map(Number);
    return new Date(
        year,
        month - 1,
        day
    );
}
function formatJapaneseDate(
    dateString
) {
    const date =
        parseDate(
            dateString
        );
    return (
        `${date.getFullYear()}年` +
        `${date.getMonth() + 1}月` +
        `${date.getDate()}日`
    );
}
/* ==================================================
   食品追加
   ================================================== */
document
    .getElementById(
        "addButton"
    )
    .addEventListener(
        "click",
        async () => {
            const name =
                document
                    .getElementById(
                        "foodName"
                    )
                    .value
                    .trim();
            const quantity =
                Number(
                    document
                        .getElementById(
                            "quantity"
                        )
                        .value
                );
            const gramsInput =
                document
                    .getElementById(
                        "grams"
                    )
                    .value;
            const grams =
                gramsInput === ""
                    ? null
                    : Number(
                        gramsInput
                    );
            if (!name) {
                alert(
                    "食品名を入力してください"
                );
                return;
            }
            if (
                quantity < 0
            ) {
                alert(
                    "個数を正しく入力してください"
                );
                return;
            }
            if (
                grams !== null &&
                grams < 0
            ) {
                alert(
                    "グラム数を正しく入力してください"
                );
                return;
            }
            try {
                await addDoc(
                    collection(
                        db,
                        "foods"
                    ),
                    {
                        name:
                            name,
                        storage:
                            selectedStorage,
                        quantity:
                            quantity,
                        grams:
                            grams,
                        bestBefore:
                            selectedBestBefore,
                        useBy:
                            selectedUseBy,
                        addedBy:
                            currentUser,
                        createdAt:
                            serverTimestamp()
                    }
                );
                resetFoodForm();
            }
            catch (error) {
                console.error(error);
                alert(
                    "食品を追加できませんでした。\n\n" +
                    error.message
                );
            }
        }
    );
/* ==================================================
   入力フォームリセット
   ================================================== */
function resetFoodForm() {
    document.getElementById(
        "foodName"
    ).value = "";
    document.getElementById(
        "quantity"
    ).value = 1;
    document.getElementById(
        "grams"
    ).value = "";
    selectedBestBefore =
        null;
    selectedUseBy =
        null;
    document.getElementById(
        "bestBeforeText"
    ).textContent =
        "未設定";
    document.getElementById(
        "useByText"
    ).textContent =
        "未設定";
    selectedStorage =
        "fridge";
    storageButtons.forEach(
        button => {
            button.classList.toggle(
                "selected",
                button.dataset.storage ===
                "fridge"
            );
        }
    );
    updateAddButton();
}
/* ==================================================
   Firestore リアルタイム監視
   ================================================== */
function startRealtimeListener() {
    const foodsQuery =
        query(
            collection(
                db,
                "foods"
            ),
            orderBy(
                "createdAt",
                "desc"
            )
        );
    onSnapshot(
        foodsQuery,
        snapshot => {
            const foods = [];
            snapshot.forEach(
                document => {
                    foods.push({
                        id:
                            document.id,
                        ...document.data()
                    });
                }
            );
            renderFoods(
                foods
            );
        },
        error => {
            console.error(error);
            alert(
                "データを読み込めませんでした。\n\n" +
                error.message
            );
        }
    );
}
/* ==================================================
   食品表示
   ================================================== */
function renderFoods(
    foods
) {
    /*
     * storageがない古いデータは
     * 冷蔵庫として扱う
     */
    const fridgeFoods =
        foods.filter(
            food =>
                food.storage !==
                "freezer"
        );
    const freezerFoods =
        foods.filter(
            food =>
                food.storage ===
                "freezer"
        );
    renderFoodList(
        fridgeFoods,
        "fridgeFoods"
    );
    renderFoodList(
        freezerFoods,
        "freezerFoods"
    );
    document.getElementById(
        "fridgeCount"
    ).textContent =
        `${fridgeFoods.length}個`;
    document.getElementById(
        "freezerCount"
    ).textContent =
        `${freezerFoods.length}個`;
}
/* ==================================================
   食品リスト
   ================================================== */
function renderFoodList(
    foods,
    containerId
) {
    const container =
        document.getElementById(
            containerId
        );
    container.innerHTML = "";
    if (
        foods.length === 0
    ) {
        container.innerHTML = `
      <div class="empty">
        食品がありません
      </div>
    `;
        return;
    }
    foods.forEach(
        food => {
            const div =
                document.createElement(
                    "div"
                );
            div.className =
                "food";
            const info =
                document.createElement(
                    "div"
                );
            const name =
                document.createElement(
                    "div"
                );
            name.className =
                "food-name";
            name.textContent =
                food.name;
            const detail =
                document.createElement(
                    "div"
                );
            detail.className =
                "food-info";
            let quantityText =
                `個数：${food.quantity ?? 0}個`;
            if (
                food.grams !== null &&
                food.grams !== undefined
            ) {
                quantityText +=
                    `　${food.grams}g`;
            }
            detail.textContent =
                quantityText;
            /* =========================
               期限
               ========================= */
            const deadline =
                food.useBy ||
                food.bestBefore;
            if (deadline) {
                const type =
                    food.useBy
                        ? "消費期限"
                        : "賞味期限";
                const deadlineDate =
                    parseDate(
                        deadline
                    );
                const today =
                    new Date();
                today.setHours(
                    0,
                    0,
                    0,
                    0
                );
                const diff =
                    Math.ceil(
                        (
                            deadlineDate -
                            today
                        ) /
                        (
                            1000 *
                            60 *
                            60 *
                            24
                        )
                    );
                detail.textContent +=
                    `\n${type}：` +
                    formatJapaneseDate(
                        deadline
                    );
                if (
                    diff < 0
                ) {
                    detail.classList.add(
                        "expired"
                    );
                    detail.textContent +=
                        "　⚠️ 期限切れ";
                }
                else if (
                    diff <= 3
                ) {
                    detail.classList.add(
                        "warning"
                    );
                    if (
                        diff === 0
                    ) {
                        detail.textContent +=
                            "　⚠️ 今日まで";
                    }
                    else {
                        detail.textContent +=
                            `　⚠️ あと${diff}日`;
                    }
                }
            }
            else {
                detail.textContent +=
                    "\n期限：未設定";
            }
            /* =========================
               追加者
               ========================= */
            const addedBy =
                document.createElement(
                    "div"
                );
            addedBy.className =
                "food-info";
            addedBy.textContent =
                `追加：${food.addedBy || "不明"}`;
            info.appendChild(
                name
            );
            info.appendChild(
                detail
            );
            info.appendChild(
                addedBy
            );
            /* =========================
               削除
               ========================= */
            const deleteButton =
                document.createElement(
                    "button"
                );
            deleteButton.className =
                "delete";
            deleteButton.textContent =
                "削除";
            deleteButton.addEventListener(
                "click",
                () => {
                    openDeleteModal(
                        food
                    );
                }
            );
            div.appendChild(
                info
            );
            div.appendChild(
                deleteButton
            );
            container.appendChild(
                div
            );
        }
    );
}
/* ==================================================
   削除モーダル
   ================================================== */
function openDeleteModal(
    food
) {
    deletingFood =
        food;
    const storageText =
        food.storage ===
            "freezer"
            ? "冷凍庫"
            : "冷蔵庫";
    document.getElementById(
        "deleteMessage"
    ).textContent =
        `「${food.name}」を${storageText}から削除しますか？`;
    document
        .getElementById(
            "deleteModal"
        )
        .classList.remove(
            "hidden"
        );
}
function closeDeleteModal() {
    deletingFood =
        null;
    document
        .getElementById(
            "deleteModal"
        )
        .classList.add(
            "hidden"
        );
}
/* キャンセル */
document
    .getElementById(
        "cancelDelete"
    )
    .addEventListener(
        "click",
        closeDeleteModal
    );
/* 削除実行 */
document
    .getElementById(
        "confirmDelete"
    )
    .addEventListener(
        "click",
        async () => {
            if (!deletingFood) {
                return;
            }
            try {
                await deleteDoc(
                    doc(
                        db,
                        "foods",
                        deletingFood.id
                    )
                );
                closeDeleteModal();
            }
            catch (error) {
                console.error(error);
                alert(
                    "削除できませんでした。\n\n" +
                    error.message
                );
            }
        }
    );
/* 背景タップで削除モーダルを閉じる */
document
    .getElementById(
        "deleteModal"
    )
    .addEventListener(
        "click",
        event => {
            if (
                event.target.id ===
                "deleteModal"
            ) {
                closeDeleteModal();
            }
        }
    );