<template>
    <div style="display: flex;align-items: flex-end;justify-content: center;height: 50vh; margin: 0; ">
        <h3 style="font-size: 200%;">TFTLOG.GG</h3>
    </div>
    <div style="display: flex; align-items: center; justify-content: center; margin: 0; ">

        <div class="search">
            <input type="text" placeholder="소환사 검색">
            <img @click="console.log(1)" class="imgSearch" src="https://s3.ap-northeast-2.amazonaws.com/cdn.wecode.co.kr/icon/search.png">
        </div>
    </div>
</template>

<script>
export default {
    name: 'Search_a'
}
</script>

<style>
body {
    margin: 0;
    background: rgb(50, 50, 50);
    text-align: center;
    align-items: center;
    color: white;
}

.search {
    position: relative;
    width: 60%;
}

input {
    width: 100%;
    border: 1px solid #bbb;
    border-radius: 20px;
    padding: 10px 12px;
    font-size: 14px;
}

.imgSearch {
    position: absolute;
    width: 17px;
    top: 10px;
    right: 12px;
    margin: 0;
}

.imgLogo {
    position: absolute;
    width: 5%;
    top: px;
    right: 55%;
    margin: 0;
}
</style>