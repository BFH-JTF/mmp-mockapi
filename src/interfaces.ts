
// Category
export interface ICategory {
    id: number,
    name: string,
    comment: string,
    parent: number,
}

export interface IDailyItem {
    id?: number,
    userID?: number,
    date: string,
    amountNumeric?: number,
    amountOption?: number,
    itemID: number,
}

export interface IUserInfo {
    id?: number,
    name: string,
    group: number,
    admin: number,
    loginType: string,
    credentials: string
}

export interface IGroupInfo {
    id?: number,
    name: string,
    periodStart: string,
    periodEnd: string,
    owner: number
}