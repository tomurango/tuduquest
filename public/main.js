const db = firebase.firestore();
var global_user;
//20210325 global_jobs には work の情報も入れ込むことにした。複数のユーザのデータを扱う場合も一つに使用と考えてるけどまあ、その時考えよう
var global_jobs = {};

/* tab navigation */
var tabBar = new mdc.tabBar.MDCTabBar(document.querySelector('#bottom_app_bar'));
//tab ページ切り替え
tabBar.listen('MDCTabBar:activated',function(event){
    var index = event["detail"]["index"];
    //一回全部を非表示にする
    /*var top_level_pages = document.getElementsByClassName('top_level_page');
    for (var i=0, len=top_level_pages.length|0; i<len; i=i+1|0) {
        top_level_pages[i].style.display = "none";
    }*/
    //indexによって処理を分岐して記述する
    if(index==0){
        document.getElementById("home_page").style.display = "flex";
    }else if(index==1){
        document.getElementById("keiken_page").style.display = "flex";
    }else if(index==2){
        document.getElementById("data_page").style.display = "flex";
    }
});


function create_job(){
    document.getElementById("job_cretea_div").style.display = "block";
    //textarea に対してイベントを指定するヤルキーパーからのコピペ
    var $input = $('#job_name_input');
    //このイベント投稿欄を閉じたときに停止させたりしたほうがいいとかあるかね？
    $input.on('input', function(event) {
        var value = $input.val();
        //console.log(value, event);
        if(value == ""){
            document.getElementById("job_create_button").disabled = true;
        }else{
            //入力あったらいけ
            document.getElementById("job_create_button").disabled = false;
        }
    });
}

function job_create_back(){
    document.getElementById("job_cretea_div").style.display = "none";
    //このイベント投稿欄を閉じたときに停止させる
    var $input = $('#job_name_input');
    $input.off('input');
    //作成ボタンを機能停止に切り替える
    document.getElementById("job_create_button").disabled = true;
    //入力を消す
    document.getElementById("job_name_input").value = "";
    //document.getElementById("job_lev_input").value = 0;
    //document.getElementById("job_text_area").value = "";
}

function send_job(){
    //jobを登録する
    var create_job_name = document.getElementById("job_name_input").value;
    //console.log(create_job_name);
    var new_job_result = {
        name: create_job_name,
        date: new firebase.firestore.Timestamp.now(),
        level: 1
        //img: user_info_global.photoURL,
        //uid: user_info_global.uid,
        //main: false
    };
    /*ログインしてから*/
    db.collection("users").doc(global_user.uid).collection("jobs").add(
        new_job_result
    ).then(function(docref_job) {
        //この記述は再利用可能と判断
        global_jobs[docref_job.id] = new_job_result;
        //20210325 worksのための空欄を代入しておく
        global_jobs[docref_job.id]["works"] = {};
        //new_job_resultをもとにボタンを挿入する処理を行う
        insert_job_button(create_job_name, docref_job.id);
        //完了したら画面を閉じる
        job_create_back();
    });
    
}

//ここでは名前をもとにボタンを入れ込もうとしているが、将来的には画像があるならそれ、無いなら文字をもとに処理を
//行いたいと考えている20210315
function insert_job_button(name, job_id){
    //20210315今日は紺くらいでいいや、あと誰かを作業にぶち込みたいかもなぁ、作業配信言うても一人だと悲しみを感じるから
    var job_div = '<div id="' + job_id + '" class="job_area"><button class="mdc-button mdc-button--outlined job_button" onclick="job_info(this);"><span class="mdc-button__ripple"></span><i class="job_icon" aria-hidden="true"></i></button><p class="job_text"></p></div>';
    var button_container = document.getElementById("job_buttons");
    //promiseはreturnしなくても動いてくれるんだろか？このままでいいかは結構考えどころかもね
    var buttons_promise = new Promise(function(resolve, reject){
        button_container.insertAdjacentHTML("beforeend", job_div);
        resolve();
    });
    var queryid = "#" + job_id; 
    buttons_promise.then(function(){
        //ここでtextContentいれる
        $(queryid).find(".job_icon").text(name[0]);
        $(queryid).find(".job_text").text(name);
    });
}

//報告書を送信するためのIDを特定するための変数
var target_job;
//ジョブのボタンを押したときの処理
function job_info(button_ele){
    //読み込み用のplaceholderを使うとかならここに書けばいいんじゃないかな？だるいから後回しだけど
    document.getElementById("job_hist_placeholder").style.display = "block";
    document.getElementById("have_history").style.display = "none";
    document.getElementById("no_history").style.display = "none";
    //ジョブ切り替えなので、worklistを空にする
    document.getElementById("work_list").innerHTML = "";

    var job_id = button_ele.parentNode.id;
    //console.log("onclick", button_ele.parentNode.id);
    target_job = button_ele.parentNode.id;
    
    //ここで挿入処理を行う
    document.getElementById("job_name").textContent = global_jobs[job_id].name;
    document.getElementById("job_level").textContent = global_jobs[job_id].level;
    //20210320報告書への変更も行う
    document.getElementById("how_much").textContent = 0;
    document.getElementById("now_level").textContent = global_jobs[job_id].level;
    document.getElementById("will_level").textContent = global_jobs[job_id].level;

    //作成ボタンを機能停止に切り替える
    document.getElementById("job_work_button").disabled = true;
    //入力を消す
    document.getElementById("textarea_job").value = "";

    //隠してある値格納を初期化する
    document.getElementById("levcha").value = 0;
    document.getElementById("levwas").value = global_jobs[job_id].level;
    document.getElementById("levwil").value = global_jobs[job_id].level;

    //no_choiceを隠して、choiceを出す処理
    document.getElementById("job_no_choice").style.display = "none";
    document.getElementById("job_choice").style.display = "block";

    //ここで選択したジョブのworkをとってくる処理を行う
    //(一度取ろうと試みたジョブに関しては再度取れなくする、ボタンの切替で表示がちゃんとなされるようにするなどの必要がありそう
    if(global_jobs[job_id].workflag){
        //console.log("二度目以降の取得");
        //textareaのイベント設定
        textarea_job_event();
        //もうすでに取得してるので取得しないが、ある場合はそれを挿入していく
        //global変数内のworksの数によって分岐で処理を行う 
        //連想配列の長さ取得サンプル
        if(Object.keys(global_jobs[job_id]["works"]).length == 0){
            //ワークが無いので無いよという表示を行う
            document.getElementById("job_hist_placeholder").style.display = "none";
            document.getElementById("have_history").style.display = "none";
            document.getElementById("no_history").style.display = "block";
        }else{
            //ワークがあったので入れ込んでいく
            document.getElementById("job_hist_placeholder").style.display = "none";
            document.getElementById("have_history").style.display = "block";
            document.getElementById("no_history").style.display = "none";
            //とってきたワークを代入していく処理
            //これでは順番がごちゃごちゃなので、配列にソートしてそこから代入していく
            /*for (let key in global_jobs[job_id]["works"]) {
                insert_work_card(global_jobs[job_id]["works"][key], key, job_id);
            }*/
            
            //配列作る
            let arr = Object.keys(global_jobs[job_id]["works"]).map((e)=>({ key: e, value: global_jobs[job_id]["works"][e] }));
            //console.log(arr);
            //console.log(global_jobs[job_id]["works"]);
            //並べ替える 20210325が正直あんまり仕組みわかってない。とりあえず動いた
            arr.sort(function(a,b){
                if(a.value.date > b.value.date) return 1;
                if(a.value.date < b.value.date) return -1;
                return 0;
            });
            //console.log(arr);
            for (i = 0; i < arr.length; i++) {
                //insert_work_card(global_jobs[job_id]["works"][key], key, job_id);
                insert_work_card(arr[i]["value"], arr[i]["key"], job_id);
            }
        }
    }else{
        //console.log("一度目の取得");
        //フラグを作ってないので取得する
        db.collection("users").doc(global_user.uid).collection("jobs").doc(job_id).collection("works")
        .orderBy("date", "desc")
        .get()
        .then((querySnapshot) => {
            //workを取りに行ったのでフラグを立てる(ボタンを押したときにとるのを一度にするため)
            global_jobs[job_id]["workflag"] = true;
            //これらの処理が完了したら送信とかできる感じにするためにtextareaのイベント処理はここに書き込んだ
            textarea_job_event();
            //ドキュメントの数によって分岐で処理を行う
            if(querySnapshot.size == 0){
                //ワークが無いので無いよという表示を行う
                document.getElementById("job_hist_placeholder").style.display = "none";
                document.getElementById("have_history").style.display = "none";
                document.getElementById("no_history").style.display = "block";
            }else{
                //ワークがあったので入れ込んでいく
                document.getElementById("job_hist_placeholder").style.display = "none";
                document.getElementById("have_history").style.display = "block";
                document.getElementById("no_history").style.display = "none";
                //とってきたワークを代入していく処理
                //新しい順でとってきて、古い順に入れていくためのreverse()
                //querySnapshot.forEach((doc) => {
                querySnapshot.docs.reverse().forEach((doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    //console.log(doc.id, " => ", doc.data());
                    //とりあえずglobal変数に入れる
                    //この辺はcreateworkの方で先に作ったからそれを参考に持ってきた感じ
                    insert_work_card(doc.data(), doc.id, job_id);
                    //global変数にも書き込みたいよね（後回し）→ 20210325とりあえず入れた
                    global_jobs[job_id]["works"][doc.id] = doc.data();
                });
            }
    
        })
        .catch((error) => {
            console.log("Error getting documents: ", error);
        });
    }
}

function get_all_jobs(user){
    //console.log("get_all_task が呼び出された");
    db.collection("users").doc(user.uid).collection("jobs").orderBy("date", "desc").get().then(function(jobs){
        //console.log(tasks);
        if (jobs.size > 0) {
            //ジョブが存在してる
            jobs.forEach(function(job){
                //グローバル変数に代入する
                global_jobs[job.id] = job.data();
                //workのための空欄を設けておく
                global_jobs[job.id]["works"] = {};
                //ジョブのボタンを作る
                insert_job_button(job.data().name, job.id);
            });
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
}

//開いたときに今あるイベントを消そうとすることに加えて、イベントを再設定する関数
//重ね掛けを防げるかなとの考えのもとのものである
function textarea_job_event(){
    var $texterea = $('#textarea_job');
    $texterea.off('input');
    /*
    try{
        //このイベント投稿欄を閉じたときに停止させる
        とくにエラー無かったら$texterea.off('input');はtryの外に出した
    }catch(e){
        console.log("error", e);
    }
    */
    //var $texterea = $('#textarea_job');
    $texterea.on('input', function(event) {
        var value = $texterea.val();
        //console.log(value, event);
        if(value == ""){
            document.getElementById("job_work_button").disabled = true;
        }else{
            //入力あったらいけ
            document.getElementById("job_work_button").disabled = false;
        }
    });
}

function send_work(){
    //一度送信したら繰り返し押さないようにボタンをdisactiveにする
    document.getElementById("job_work_button").disabled = true;
    //20210325textareaで取得し忘れていた
    var work_text = document.getElementById("textarea_job").value;
    //textareaの中身も空にしておく
    document.getElementById("textarea_job").value = "";
    var levchange = Number(document.getElementById("levcha").value);
    var levwas = Number(document.getElementById("levwas").value);
    var levwill = Number(document.getElementById("levwil").value);
    var new_work_data = {
        text: work_text,
        date: new firebase.firestore.Timestamp.now(),
        LevelChange: levchange,
        LevelWas: levwas,
        LevelWill: levwill
    };
    //！！送信！！
    var work_promise = db.collection("users").doc(global_user.uid).collection("jobs").doc(target_job).collection("works").add(new_work_data);
    var job_promise = db.collection("users").doc(global_user.uid).collection("jobs").doc(target_job).update({
        level: firebase.firestore.FieldValue.increment(levchange)
    });
    var result = Promise.all([work_promise, job_promise]).then((values) => {
        //console.log(values);
        //報告が完了したから書き込む処理 表示切替とか insert とか
        document.getElementById("no_history").style.display = "none";
        document.getElementById("have_history").style.display = "block";
        insert_work_card(new_work_data, values[0].id, values[0].parent.parent.id);
        //global変数にも書き込みたいよね（後回し）→ 20210325とりあえず入れた
        global_jobs[values[0].parent.parent.id]["works"][values[0].id] = new_work_data;
    });
    return result;
}

function change_up(){
    //表示と隠れ値の両方をボタンによる変換を行いたい
    document.getElementById("how_much").textContent ++;
    document.getElementById("will_level").textContent ++;
    //正の値の時は符号を手動でつけて、負の時は外す
    var change_num = document.getElementById("how_much").textContent;
    if(change_num >= 0){
        //正の時
        document.getElementById("how_much").classList.add("how_much_plus");
    }else{
        //負の時
        document.getElementById("how_much").classList.remove("how_much_plus");
    }

    //こっから隠れ値
    document.getElementById("levcha").value ++ ;
    document.getElementById("levwil").value ++ ;
}

function change_down(){
    document.getElementById("how_much").textContent --;
    document.getElementById("will_level").textContent --;
    var change_num = document.getElementById("how_much").textContent;
    if(change_num >= 0){
        //正の時
        document.getElementById("how_much").classList.add("how_much_plus");
    }else{
        //負の時
        document.getElementById("how_much").classList.remove("how_much_plus");
    }

    //こっから隠れ値
    document.getElementById("levcha").value -- ;
    document.getElementById("levwil").value -- ;
}

function insert_work_card(work_data, work_id, job_id){
    //console.log(work_data);
    //globaltest=work_data;
    //console.log(globaltest);
    /*var new_work_data = {
        name: create_job_name,
        date: new firebase.firestore.Timestamp.now(),
        LevelChange: levchange,
        LevelWas: levwas,
        LevelWill: levwill
    };*/
    //20210325めっちゃ横長。いつか削減できないかなぁ...
    var work_div = '<div id="' + job_id + "_" + work_id + '" class="mdc-card mdc-card--outlined" style="margin: 8px; display: flex; flex-direction: row; min-height: 120px;"><div style="width: 50%; position: relative;"><p class="addlev" style="margin: 0px; font-size: 4em; text-align: center;">0</p><p style="position: relative; margin: 0px; font-size: 0.5em; color: #999999; text-align: center; bottom: 12px;">Lv<span class="waslev">0</span> → Lv<span class="nowlev">0</span></p></div><div style="width: 50%;"><p class="work_date" style="font-size: 0.7em; color: #999999; margin: 20px 0px 0px 0px;">ここに日付が入る</p><p class="work_text" style="margin: 0px 16px 16px 0px;">こんなことがありました！</p></div></div>';
    var work_container = document.getElementById("work_list");
    //promiseはreturnしなくても動いてくれるんだろか？このままでいいかは結構考えどころかもね
    var work_promise = new Promise(function(resolve, reject){
        work_container.insertAdjacentHTML("afterbegin", work_div);
        resolve();
    });
    var queryid = "#" + job_id + "_" + work_id; 
    work_promise.then(function(){
        //console.log(work_data);
        if(work_data.LevelChange >=0 ){
            //正の時
            //document.getElementById("").classList.add("how_much_plus");
            $(queryid).find(".addlev").addClass("how_much_plus");
        }else{
            //負の時
            //document.getElementById("how_much").classList.remove("how_much_plus");
            $(queryid).find(".addlev").removeClass("how_much_plus");
        }
        //ここでtextContentいれる
        $(queryid).find(".addlev").text(work_data.LevelChange);
        $(queryid).find(".waslev").text(work_data.LevelWas);
        $(queryid).find(".nowlev").text(work_data.LevelWill);
        //日付入れる
        //console.log(work_data.LevelChange);
        //console.log(work_data.date);
        var text_date = firedate_todisplay(work_data.date);
        $(queryid).find(".work_date").text(text_date);
        //コメント入れる
        $(queryid).find(".work_text").text(work_data.text);
    });
}

//20210325firestoreのタイムスタンプを生じできる文字列に変える関数（コピペ後少し編集）
function firedate_todisplay(fire_date){
    //console.log(fire_date);
    var date = fire_date.toDate();
    var year  = date.getFullYear();
    var month = date.getMonth() + 1;
    var day   = date.getDate();
    //var hours  = date.getHours();
    //var minutes  = date.getMinutes();
    //return String(year) + "年" + String(month) + "月" + String(day) + "日 " + String(hours) + ":" + String(minutes);
    return String(year) + "年" + String(month) + "月" + String(day) + "日 ";
}