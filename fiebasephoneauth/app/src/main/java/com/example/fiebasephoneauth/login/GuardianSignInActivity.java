package com.example.fiebasephoneauth.login;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.example.fiebasephoneauth.Guardian.connection.GuardianNotConnected;
import com.example.fiebasephoneauth.Guardian.page.GuardianHome;
import com.example.fiebasephoneauth.R;
import com.example.fiebasephoneauth.databinding.ActivityGuardianSignInBinding;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

public class GuardianSignInActivity extends AppCompatActivity {

    DatabaseReference databaseReference = FirebaseDatabase.getInstance().getReferenceFromUrl("https://fir-phoneauth-97f7e-default-rtdb.firebaseio.com/");
    Button loginButton;
    TextView backButton;

    ActivityGuardianSignInBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityGuardianSignInBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        loginButton = binding.loginButton;
        backButton = binding.backButton;


        setContentView(R.layout.activity_guardian_sign_in);

        final EditText id = findViewById(R.id.idForm);
        final EditText password = findViewById(R.id.pwForm);
        final Button loginBtn = findViewById(R.id.loginButton);
        final TextView backBtn = findViewById(R.id.backButton);

        backBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(GuardianSignInActivity.this, MainActivity.class);
                startActivity(intent);
            }
        });

        loginBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                final String idTxt = id.getText().toString();
                final String passwordTxt = password.getText().toString();

                if(idTxt.isEmpty() || passwordTxt.isEmpty()){
                    Toast.makeText(GuardianSignInActivity.this, "모든 정보를 입력해주세요.", Toast.LENGTH_SHORT).show();
                }
                else{
                    databaseReference.child("Guardian_list").addListenerForSingleValueEvent(new ValueEventListener() {
                        @Override
                        public void onDataChange(@NonNull DataSnapshot snapshot) {

                            if(snapshot.hasChild(idTxt)){

                                final String getPassword = snapshot.child(idTxt).child("password").getValue(String.class);

                                if(getPassword.equals(passwordTxt)){
                                    Toast.makeText(GuardianSignInActivity.this, "로그인 성공 !", Toast.LENGTH_SHORT).show();
                                    //로그인 성공 시 연동 여부 파악 후 Home화면으로 이동 or 연동 화면으로 이동
                                    databaseReference.child("Guardian_list").child(idTxt).addListenerForSingleValueEvent(new ValueEventListener() {
                                        @Override
                                        public void onDataChange(@NonNull DataSnapshot snapshot) {
                                            if(snapshot.hasChild("CareReceiverID")){
                                                //기존 로그인 정보 삭제
                                                SharedPreferences sharedPreferences = getSharedPreferences("autoLogin",MODE_PRIVATE);
                                                SharedPreferences.Editor editor = sharedPreferences.edit();
                                                editor.clear();
                                                editor.commit();

                                                //자동 로그인을 위한 로그인 정보 저장
                                                editor.putString("id",idTxt);
                                                editor.putString("password",passwordTxt);
                                                editor.putString("type", "Guardian");
                                                editor.commit();



                                                //GuardianHome으로 이동
                                                Intent intent = new Intent(GuardianSignInActivity.this, GuardianHome.class);
                                                intent.putExtra("id",idTxt);
                                                startActivity(intent);
                                                finish();
                                            }

                                            else{
                                                Intent intent = new Intent(GuardianSignInActivity.this, GuardianNotConnected.class);
                                                intent.putExtra("id",idTxt);
                                                startActivity(intent);
                                                finish();
                                            }
                                        }

                                        @Override
                                        public void onCancelled(@NonNull DatabaseError error) {

                                        }
                                    });
                                }

                                else{
                                    Toast.makeText(GuardianSignInActivity.this, "비밀번호를 확인해주세요.", Toast.LENGTH_SHORT).show();
                                }
                            }
                            else{
                                Toast.makeText(GuardianSignInActivity.this, "아이디를 확인해주세요.", Toast.LENGTH_SHORT).show();
                            }

                        }

                        @Override
                        public void onCancelled(@NonNull DatabaseError error) {

                        }
                    });
                }

            }
        });


    }
}