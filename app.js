var firebaseConfig = {
    apiKey: "AIzaSyCyloxmk4_L4_WKeXi6w8gimoFGNfdPz3o",
    authDomain: "azmessage-1998.firebaseapp.com",
    databaseURL: "https://azmessage-1998-default-rtdb.firebaseio.com",
    projectId: "azmessage-1998",
    storageBucket: "azmessage-1998.firebasestorage.app",
    messagingSenderId: "989356500260",
    appId: "1:989356500260:web:23c01bdabaff85555bbfb1",
    measurementId: "G-8CBX47S3BR"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.database();
var auth = firebase.auth();

var baseSchemeUrl = "azapp://open";
var githubReleaseUrl = "https://github.com/mehemmed988/AzMessage";
var urlParams = new URLSearchParams(window.location.search);
var redirectPath = urlParams.get('redirect');
var targetUsername = null;
var isInvalid = false; 

var infoText = document.getElementById("infoText");
var openAppBtn = document.getElementById("openAppBtn");
var fallbackBtn = document.getElementById("fallbackBtn");
var loader = document.getElementById("loader");

// 1. URL Analizi ve 404 / redirect Kontrolü
if (urlParams.has('redirect')) {
    if (redirectPath && redirectPath.trim() !== "") {
        var decodedRedirect = decodeURIComponent(redirectPath);
        var pathSegments = decodedRedirect.split("/");
        var userIndex = pathSegments.indexOf("user");
        
        if (userIndex !== -1 && pathSegments.length > userIndex + 1 && pathSegments[userIndex + 1].trim() !== "") {
            targetUsername = pathSegments[userIndex + 1];
        } else {
            isInvalid = true;
        }
    } else {
        isInvalid = true;
    }
} else {
    var currentPath = window.location.pathname;
    var pathSegments = currentPath.split("/");
    var userIndex = pathSegments.indexOf("user");
    
    if (userIndex !== -1 && pathSegments.length > userIndex + 1) {
        targetUsername = pathSegments[userIndex + 1];
    }
}

// Kullanıcı butona tıkladığında çalışan akıllı kontrol ve indirme yönlendirme fonksiyonu
function bindManualOpenHandler(schemeUrl) {
    openAppBtn.addEventListener("click", function(e) {
        e.preventDefault();
        
        var appOpened = false;
        var redirectTimer = null;

        function handleVisibilityChange() {
            if (document.hidden) {
                appOpened = true;
                if (redirectTimer) {
                    clearTimeout(redirectTimer);
                }
                document.removeEventListener("visibilitychange", handleVisibilityChange);
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Scheme'i tetikle
        window.location.href = schemeUrl;

        // Tıklandıktan sonra açılmazsa uygulama yok demektir, indirme sayfasına at
        redirectTimer = setTimeout(function() {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            
            if (!appOpened && !document.hidden) {
                infoText.innerText = "Uygulama cihazınızda bulunamadı. İndirme sayfasına yönlendiriliyorsunuz...";
                setTimeout(function() {
                    window.location.href = githubReleaseUrl;
                }, 1000);
            }
        }, 2500);
    });
}

// 2. Durum Değerlendirmesi ve Akış Yönetimi
if (isInvalid) {
    loader.style.display = "none";
    infoText.className = "error-box";
    infoText.innerText = "Geçersiz veya hatalı bağlantı adresi!";
    fallbackBtn.style.display = "block";
} 
else if (!targetUsername) {
    // ANA SAYFA: Sayfa açıldığı an direkt yönlendirmeyi dene, açılmazsa normal tuşu göster
    loader.style.display = "none";
    infoText.innerText = "AzMessage ana sayfasına yönlendiriliyorsunuz...";
    
    openAppBtn.href = baseSchemeUrl;
    openAppBtn.innerText = "Uygulamayı Aç";
    openAppBtn.style.display = "block";

    // Manuel tıklama kontrolünü bağla
    bindManualOpenHandler(baseSchemeUrl);

    // İlk açılışta hızlıca yönlendirmeyi dene
    window.location.href = baseSchemeUrl;
} 
else {
    // PROFİL SAYFASI: Kullanıcıyı doğrula, bulunur bulunmaz direkt açmayı dene
    infoText.innerText = "Güvenli oturum açılıyor...";

    auth.signInAnonymously()
        .then(function() {
            infoText.innerText = "@" + targetUsername + " kontrol ediliyor...";
            return db.ref('users').orderByChild('username').equalTo(targetUsername).once('value');
        })
        .then(function(snapshot) {
            var found = false;
            
            if (snapshot.exists()) {
                snapshot.forEach(function(childSnapshot) {
                    var userData = childSnapshot.val();
                    if (userData && userData.username === targetUsername) {
                        found = true;
                    }
                });
            }

            loader.style.display = "none";

            if (found) {
                var targetSchemeUrl = baseSchemeUrl + "?user=" + encodeURIComponent(targetUsername);
                
                infoText.className = "success-box";
                infoText.innerText = "@" + targetUsername + " kullanıcısı bulundu. Uygulama açılıyor...";
                
                // Normal butonumuzu hazırlayıp gösterelim
                openAppBtn.href = targetSchemeUrl;
                openAppBtn.innerText = "@" + targetUsername + " Profilini Aç";
                openAppBtn.style.display = "block";

                // Kullanıcı butona tıkladığında çalışacak akıllı kontrolü bağla
                bindManualOpenHandler(targetSchemeUrl);

                // İlk açılışta hızlıca yönlendirmeyi dene
                window.location.href = targetSchemeUrl;

            } else {
                loader.style.display = "none";
                infoText.className = "error-box";
                infoText.innerText = "@" + targetUsername + " adında bir kullanıcı bulunamadı!";
                fallbackBtn.style.display = "block";
            }
        })
        .catch(function(error) {
            loader.style.display = "none";
            infoText.className = "error-box";
            infoText.innerText = "Oturum veya bağlantı hatası oluştu.";
            fallbackBtn.style.display = "block";
            console.error("Firebase Hatası:", error);
        });
}
