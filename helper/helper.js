class Helper {

    static setDate(date){
        date = new Date(date);
        date.setHours(0, 0, 0, 0);
        return date;
    }
}

module.exports = Helper;