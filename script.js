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
/* =========================
   Firebase設定
   ========================= */
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyB8DRhjiburjP3jKn4wDW2dmdLi843L0go",
    authDomain: "fridge-68cfc.firebaseapp.com",
    projectId: "fridge-68cfc",
    storageBucket: "fridge-68cfc.firebasestorage.app",
    messagingSenderId: "492169932952",
    appId: "1:492169932952:web:ba607e6e5d0db4700aa0ed",
    measurementId: "G-66TKL6ENX8"
};
const firebaseApp =
    initializeApp(firebaseConfig);
const db =
    getFirestore(firebaseApp);
/* =========================
   状態
   ========================= */
let currentUser =
    localStorage.getItem("fridgeUser");
let selectedBestBefore = null;
let selectedUseBy = null;
let editingDateType = null;
/* =========================
   HTML取得
   ========================= */
const loginScreen =
    document.getElementById("loginScreen");
const appScreen =
    document.getElementById("app");
const currentUserText =
    document.getElementById("currentUser");
/* =========================
   ユーザー選択
   ========================= */
/*
  HTMLにuser-buttonを追加するだけで
  自動的にここで処理される。
*/
const userButtons =
    document.querySelectorAll(".user-button");
userButtons.forEach(button => {
    button.addEventListener(
        "click",
        () => {
            userButtons.forEach(b => {
                b.classList.remove("selected");
            });
            button.classList.add("selected");
            currentUser =
                button.dataset.user;
        }
    );
});
/* =========================
   ログイン
   ========================= */
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
/* =========================
   自動ログイン
   ========================= */
if (currentUser) {
    showApp();
}
/* =========================
   ログアウト
   ========================= */
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
   日付
   ================================================== */
/* =========================
   今日＋2日
   ========================= */
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
/* =========================
   日付モーダルを開く
   ========================= */
function openDateModal(type) {
    editingDateType = type;
    document.getElementById(
        "modalTitle"
    ).textContent =
        type === "bestBefore"
            ? "賞味期限"
            : "消費期限";
    let date;
    if (
        type === "bestBefore" &&
        selectedBestBefore
    ) {
        date =
            parseDate(
                selectedBestBefore
            );
    } else if (
        type === "useBy" &&
        selectedUseBy
    ) {
        date =
            parseDate(
                selectedUseBy
            );
    } else {
        date =
            getDefaultDate();
    }
    createWheels(date);
    document
        .getElementById("dateModal")
        .classList.remove("hidden");
}
/* =========================
   ホイール生成
   ========================= */
function createWheels(date) {
    const year =
        date.getFullYear();
    const month =
        date.getMonth() + 1;
    const day =
        date.getDate();
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
    /* 年 */
    for (
        let y = year - 5;
        y <= year + 10;
        y++
    ) {
        addWheelItem(
            yearWheel,
            y,
            `${y}年`,
            y === year
        );
    }
    /* 月 */
    for (
        let m = 1;
        m <= 12;
        m++
    ) {
        addWheelItem(
            monthWheel,
            m,
            `${m}月`,
            m === month
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
        addWheelItem(
            dayWheel,
            d,
            `${d}日`,
            d === day
        );
    }
    setTimeout(() => {
        scrollToSelected(yearWheel);
        scrollToSelected(monthWheel);
        scrollToSelected(dayWheel);
    }, 10);
}
/* =========================
   ホイール項目
   ========================= */
function addWheelItem(
    wheel,
    value,
    text,
    selected
) {
    const item =
        document.createElement("div");
    item.className =
        "wheel-item";
    if (selected) {
        item.classList.add(
            "selected"
        );
    }
    item.dataset.value =
        value;
    item.textContent =
        text;
    wheel.appendChild(item);
}
/* =========================
   選択位置
   ========================= */
function scrollToSelected(wheel) {
    const selected =
        wheel.querySelector(
            ".selected"
        );
    if (!selected) return;
    selected.scrollIntoView({
        block: "center"
    });
}
/* =========================
   ホイールから値を取得
   ========================= */
function getWheelValue(wheel) {
    const items =
        [...wheel.children];
    const rect =
        wheel.getBoundingClientRect();
    const center =
        rect.top +
        wheel.clientHeight / 2;
    let closest = null;
    let distance =
        Infinity;
    items.forEach(item => {
        const itemRect =
            item.getBoundingClientRect();
        const itemCenter =
            itemRect.top +
            itemRect.height / 2;
        const difference =
            Math.abs(
                center -
                itemCenter
            );
        if (
            difference <
            distance
        ) {
            distance =
                difference;
            closest =
                item;
        }
    });
    return Number(
        closest.dataset.value
    );
}
/* =========================
   期限ボタン
   ========================= */
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
/* =========================
   モーダルを閉じる
   ========================= */
document
    .getElementById("closeModal")
    .addEventListener(
        "click",
        () => {
            document
                .getElementById("dateModal")
                .classList.add("hidden");
        }
    );
/* =========================
   日付を設定
   ========================= */
document
    .getElementById("saveDate")
    .addEventListener(
        "click",
        () => {
            const year =
                getWheelValue(
                    document.getElementById(
                        "yearWheel"
                    )
                );
            const month =
                getWheelValue(
                    document.getElementById(
                        "monthWheel"
                    )
                );
            const day =
                getWheelValue(
                    document.getElementById(
                        "dayWheel"
                    )
                );
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
                    formatJapaneseDate(date);
            } else {
                selectedUseBy =
                    date;
                document.getElementById(
                    "useByText"
                ).textContent =
                    formatJapaneseDate(date);
            }
            document
                .getElementById("dateModal")
                .classList.add("hidden");
        }
    );
/* =========================
   期限なし
   ========================= */
document
    .getElementById("clearDate")
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
            } else {
                selectedUseBy =
                    null;
                document.getElementById(
                    "useByText"
                ).textContent =
                    "未設定";
            }
            document
                .getElementById("dateModal")
                .classList.add("hidden");
        }
    );
/* =========================
   日付文字列
   ========================= */
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
function parseDate(dateString) {
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
        parseDate(dateString);
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
    .getElementById("addButton")
    .addEventListener(
        "click",
        async () => {
            const name =
                document
                    .getElementById("foodName")
                    .value
                    .trim();
            const quantity =
                Number(
                    document
                        .getElementById("quantity")
                        .value
                );
            const gramsInput =
                document
                    .getElementById("grams")
                    .value;
            const grams =
                gramsInput === ""
                    ? null
                    : Number(gramsInput);
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
                /* リセット */
                document
                    .getElementById("foodName")
                    .value = "";
                document
                    .getElementById("quantity")
                    .value = 1;
                document
                    .getElementById("grams")
                    .value = "";
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
            } catch (error) {
                console.error(error);
                alert(
                    "食品を追加できませんでした。\n\n" +
                    error.message
                );
            }
        }
    );
/* ==================================================
   Firestoreリアルタイム同期
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
            renderFoods(foods);
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
function renderFoods(foods) {
    const container =
        document.getElementById(
            "foods"
        );
    container.innerHTML = "";
    if (
        foods.length === 0
    ) {
        container.innerHTML = `
      <div class="empty">
        冷蔵庫に食品がありません
      </div>
    `;
        return;
    }
    foods.forEach(food => {
        const div =
            document.createElement("div");
        div.className =
            "food";
        const info =
            document.createElement("div");
        const name =
            document.createElement("div");
        name.className =
            "food-name";
        name.textContent =
            food.name;
        const detail =
            document.createElement("div");
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
                parseDate(deadline);
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
            } else if (
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
                } else {
                    detail.textContent +=
                        `　⚠️ あと${diff}日`;
                }
            }
        } else {
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
        info.appendChild(name);
        info.appendChild(detail);
        info.appendChild(addedBy);
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
            async () => {
                if (
                    !confirm(
                        `${food.name}を削除しますか？`
                    )
                ) {
                    return;
                }
                try {
                    await deleteDoc(
                        doc(
                            db,
                            "foods",
                            food.id
                        )
                    );
                } catch (error) {
                    console.error(error);
                    alert(
                        "削除できませんでした。\n\n" +
                        error.message
                    );
                }
            }
        );
        div.appendChild(info);
        div.appendChild(
            deleteButton
        );
        container.appendChild(div);
    });
}