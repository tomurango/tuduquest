
$(document).ready(function(){
    //chart js のグラフが表示されない問題の解決のための検証
    //document.getElementById("chart_contain").textContent = window.devicePixelRatio;
    firebase.auth().getRedirectResult().then(function(result) {
        //console.log(result);
        if (result.credential) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // ...
        //console.log(token);
        }
        // The signed-in user info.
        global_user = result.user;
        
        
        
        //user 登録をする関数を書く 初めてのログインのみ登録を行う
        //user_register(result.user);
        if(global_user != null){
            //画像を挿入する処理だけして判別する
            //ログインしてる場合のみ行う。匿名ユーザである場合は問題が発生しそうではある
            //firestoreのユーザデータを取得
            //非ログイン後のログイン入力でこっちは機能するけど、永続性が効いてないと判断し、下を仮設
            //fire_userdata_get(global_user.uid);
            //list page の表示を切り替える関数
            //list_page_check(result.user);
            //ログインしてたらボタンの表示を差し替える
            document.getElementById("usericon").src = global_user.photoURL;
            document.getElementById("login_icon").style.display = "flex";
            document.getElementById("login_button").style.display = "none";
            home_page_check(result.user);
        }else{
            //ログインしてないときはこっちの処理でログインしてるかどうかを試みる
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    // User is signed in.
                    //console.log("user", user);
                    //イケるっぽいから書き足しちゃうね＾～
                    global_user = user;
                    //fire_userdata_get(global_user.uid);
                    //list page の表示を切り替える関数
                    //list_page_check(user);
                    //ログインしてたらボタンの表示を差し替える
                    document.getElementById("usericon").src = global_user.photoURL;
                    document.getElementById("login_icon").style.display = "flex";
                    document.getElementById("login_button").style.display = "none";
                    home_page_check(user);
                } else {
                    // No user is signed in.
                    //こうなったら特に操作は発生しない感じかなと思ってたけど共通部分を持ってきました
                    //list page の表示を切り替える関数
                    //list_page_check(result.user);
                    //ログインしてないならログアウトボタンは消す
                    document.getElementById("logout_button").style.display = "none";
                    home_page_check(result.user);
                }
              });
        }
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
        console.log(errorCode);
        console.log(errorMessage);
        console.log(email);
        console.log(credential);
    });
});


function login_card_display(){
    //ログインのためのカードを出してくる
    document.getElementById("login_card_div").style.display = "block";
}
function login_card_display_back(){
    //ログインのためのカードを消す
    document.getElementById("login_card_div").style.display = "none";
}

//google
function google_click(){
    //ログインの動き
    //console.log("google ログインします");
    //セッションの永続性を指定から、ログインしてる感じ
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(function() {
        var provider = new firebase.auth.GoogleAuthProvider();
        // Existing and future Auth states are now persisted in the current
        // session only. Closing the window would clear any existing state even
        // if a user forgets to sign out.
        // ...
        // New sign-in will be persisted with session persistence.
        return firebase.auth().signInWithRedirect(provider).then(user =>{
            // Get the user's ID token as it is needed to exchange for a session cookie.
            return user.getIdToken();/*.then(idToken => {
                // Session login endpoint is queried and the session cookie is set.
                // CSRF protection should be taken into account.
                // ...
                const csrfToken = getCookie('csrfToken')
                return postIdTokenToSessionLogin('/sessionLogin', idToken, csrfToken);
            });*/
        });
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
    });
}
//ログアウト
function log_out(){
    firebase.auth().signOut().then(()=>{
        //console.log("ログアウトしました");
        //ログアウトしよーぜ
        //リダイレクトしてんね
        location.reload();
    })
    .catch( (error)=>{
        console.log(`ログアウト時にエラーが発生しました (${error})`);
    });
}

//userの種類によってページの表示を切り替えるための関数
function home_page_check(user){
    document.getElementById("home_page_placeholder").style.display = "none";
    if (user) {
        //とりあえず表示を切り替える動きをさせる
        //document.getElementById("home_page_placeholder").style.display = "none";
        document.getElementById("home_page_iden").style.display = "block";
        //一度しか行わないという理解でfirestoreからデータをとってきてグローバルとかに大移入する動きを行う
        get_all_jobs(user);
    } else {
        //console.log("ログインしてない");
        //ログインしてないならログアウトボタンは消す
        //document.getElementById("logout_button").style.display = "none";
        //ここで本来は匿名ユーザでログインさせたい
        //今はログインをさせる表示的誘導のみ行う
        //document.getElementById("task_complate").style.display = "none";
        //document.getElementById("to_do_items").style.display = "none";
        //document.getElementById("finished_container").style.display = "none";
        //document.getElementById("create_task").style.display = "none";
       // document.getElementById("home_page_placeholder").style.display = "none";
        document.getElementById("home_page_anonymous").style.display = "block";
    }
}