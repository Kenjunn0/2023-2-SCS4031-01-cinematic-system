const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

/** 응급상황 발생 Trigger
 *
 * 1. 피보호자 db를 찾아 응급상황 발생 여부를 확인
 * 2. 응급상황 발생 시 피보호자에게 푸시 알림을 보냄
 * 3. 15초 이내 응답이 없을 시 응급상황 발생으로 판단하고 보호자에게 푸시 알림을 보냄
 */
exports.checkEmergency = functions.database.ref("/CareReceiver_list/{userId}/ActivityData/emergency")
    .onUpdate((snapshot, context) => {
      const emergencyValue = snapshot.after.val();
      const userId = context.params.userId;
      console.log("userId: ", userId);

      // emergencyValue가 1이면 응급상황 발생
      if (emergencyValue === "1") {
        const careReceiverDataRef = admin.database().ref(`/CareReceiver_list/${userId}`);
        const guardianDataRef = admin.database().ref("/Guardian_list/");

        // 피보호자에게 푸시 알림을 보냄
        careReceiverDataRef.once("value").then((careReceiverSnapshot) => {
          const careReceiverData = careReceiverSnapshot.val();
          const tokenObject = careReceiverData.deviceToken;
          console.log("tokenObject: ", tokenObject);

          for (const key in tokenObject) {
            if (Object.prototype.hasOwnProperty.call(tokenObject, key)) {
              const token = tokenObject[key];
              const message = {
                notification: {
                  title: "응급 상황 발생",
                  body: "응급 버튼을 누른 것이 아니라면 15초 내에 응답해주세요",
                },
                token: token,
              };
              admin.messaging().send(message).then((response) => {
                console.log("Message sent successfully:", response, "token: ", token);
              })
                  .catch((error) => {
                    console.log("Error sending message: ", error);
                  });
            }
          }
        });

        setTimeout(() => {
            // 15초 이내에 응답이 없으면 응급상황 발생으로 판단하고 보호자에게 푸시 알림을 보냄
            careReceiverDataRef.child("ActivityData").child("emergency").once("value").then((emergencySnapshot) => {
                const emergencyValue = emergencySnapshot.val();
                console.log("emergencyValue: ", emergencyValue);

                if (emergencyValue === "1") {

                    // 피보호자의 보호자를 찾아서 푸시 알림을 보냄
                    guardianDataRef.once("value").then((guardianListSnapshot) => {
                        guardianListSnapshot.forEach((guardianSnapshot) => {
                            const guardianData = guardianSnapshot.val();
                            const carereceiverId = guardianData.CareReceiverID;

                            if (carereceiverId === userId && guardianData.deviceToken) {
                                const userNameRef = admin.database().ref(`/CareReceiver_list/${userId}/name`);

                                // Read the data
                                userNameRef.once("value").then((userNameSnapshot) => {
                                    const name = userNameSnapshot.val();

                                    const tokenObject = guardianData.deviceToken;
                                    console.log("tokenObject: ", tokenObject);

                                    for (const key in tokenObject) {
                                        if (Object.prototype.hasOwnProperty.call(tokenObject, key)) {
                                            const token = tokenObject[key];
                                            const message = {
                                                notification: {
                                                    title: "응급 상황 발생",
                                                    body: `${name} 님이 응급 버튼을 눌렀습니다`,
                                                },
                                                token: token,
                                            };
                                            admin.messaging().send(message).then((response) => {
                                                console.log("Message sent successfully:", response, "token: ", token);
                                            })
                                                .catch((error) => {
                                                    console.log("Error sending message: ", error);
                                                });
                                        }
                                    }
                                });
                            }
                        });
                    });

                    // 응급상황 기록
                    careReceiverDataRef.child("ActivityData").child("latestEvent").once("value").then((latestEventSnapshot) => {
                        const latestEvent = latestEventSnapshot.val();
                        const keys = Object.keys(latestEvent);
                        const numChildren = Object.keys(latestEvent).length;
                        console.log("numChildren: ", numChildren);
                        // 최근 4개의 기록만 남기고 나머지는 삭제
                        if (numChildren > 4) {
                            keys.sort();
                            const oldestKey = keys[0];
                            careReceiverDataRef.child("ActivityData").child("latestEvent").child(oldestKey).remove();
                        }
                    });
                    const emergencyTimeStamp = Date.now();
                    const latestEvent = admin.database().ref(`/CareReceiver_list/${userId}/ActivityData/latestEvent`);
                    latestEvent.push(
                        {
                            time : emergencyTimeStamp,
                            type : "emergency"
                        }
                    );
                }
            });
        }, 15000);
      }
    });

// 화재상황 발생 시 Trigger
// eslint-disable-next-line max-len
exports.checkFire = functions.database.ref("/CareReceiver_list/{userId}/ActivityData/fire")
    .onUpdate((snapshot, context) => {
      const fireValue = snapshot.after.val();
      const userId = context.params.userId;
      console.log("userId: ", userId);

      if (fireValue === "1") {
        const careReceiverDataRef = admin.database().ref(`/CareReceiver_list/${userId}`);
        const guardianDataRef = admin.database().ref("/Guardian_list/");

          // 피보호자에게 푸시 알림을 보냄
          careReceiverDataRef.once("value").then((careReceiverSnapshot) => {
              const careReceiverData = careReceiverSnapshot.val();
              const tokenObject = careReceiverData.deviceToken;
              console.log("tokenObject: ", tokenObject);

              for (const key in tokenObject) {
                  if (Object.prototype.hasOwnProperty.call(tokenObject, key)) {
                      const token = tokenObject[key];
                      const message = {
                          notification: {
                              title: "화재 상황 발생",
                              body: "화재 감자기에서 화재를 감지했습니다",
                          },
                          token: token,
                      };
                      admin.messaging().send(message).then((response) => {
                          console.log("Message sent successfully:", response, "token: ", token);
                      })
                          .catch((error) => {
                              console.log("Error sending message: ", error);
                          });
                  }
              }
          });

        // 피보호자의 보호자를 찾아서 푸시 알림을 보냄
        guardianDataRef.once("value").then((guardianListSnapshot) => {

          guardianListSnapshot.forEach((guardianSnapshot) => {
            const guardianData = guardianSnapshot.val();
            const carereceiverId = guardianData.CareReceiverID;

            if (carereceiverId === userId && guardianData.deviceToken) {
              // eslint-disable-next-line max-len
              const userNameRef = admin.database().ref(`/CareReceiver_list/${userId}/name`);

              // Read the data
              userNameRef.once("value").then((userNameSnapshot) => {
                const name = userNameSnapshot.val();

                const tokenObject = guardianData.deviceToken;
                console.log("tokenObject: ", tokenObject);

                for (const key in tokenObject) {
                  if (Object.prototype.hasOwnProperty.call(tokenObject, key)) {
                    const token = tokenObject[key];
                    const message = {
                      notification: {
                        title: "화재 상황 발생",
                        body: `${name} 님의 집에서 화재가 감지되었습니다`,
                      },
                      token: token,
                    };
                    admin.messaging().send(message).then((response) => {
                      // eslint-disable-next-line max-len
                      console.log("Message sent successfully:", response, "token: ", token);
                    })
                        .catch((error) => {
                          console.log("Error sending message: ", error);
                        }
                    );
                  }
                }
              });
            }
          });
        });
        // 화재상황 기록
        careReceiverDataRef.child("ActivityData").child("latestEvent").once("value").then((latestEventSnapshot) => {
            const latestEvent = latestEventSnapshot.val();
            const keys = Object.keys(latestEvent);
            const numChildren = Object.keys(latestEvent).length;
            console.log("numChildren: ", numChildren);
            // 최근 4개의 기록만 남기고 나머지는 삭제
            if (numChildren > 4) {
                  keys.sort();
                  const oldestKey = keys[0];
                  careReceiverDataRef.child("ActivityData").child("latestEvent").child(oldestKey).remove();
            }
        });
        const fireTimeStamp = Date.now();
        const latestEvent = admin.database().ref(`/CareReceiver_list/${userId}/ActivityData/latestEvent`);
        latestEvent.push(
              {
                  time : fireTimeStamp,
                  type : "fire"
              }
        );

        // 화재상황 발생 시 피보호자의 화재상황 발생 여부를 0으로 초기화
        careReceiverDataRef.child("ActivityData").child("fire").set("0");
      }
    });

// 문 열림 상황 발생 시 Trigger
// eslint-disable-next-line max-len
exports.checkOuting = functions.database.ref("/CareReceiver_list/{userId}/ActivityData/door")
    .onUpdate((snapshot, context) => {

    });
