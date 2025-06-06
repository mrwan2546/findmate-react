import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../services/api";

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import AppTheme from "../AppTheme";

const OTPVerification = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const navigate = useNavigate();
  const location = useLocation();
  const { registration_id, email } = location.state || {};

  useEffect(() => {
    if (!registration_id || !email) {
      navigate("/register");
      return;
    }

    let timer;
    if (timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timeLeft, navigate, registration_id, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/verify-otp", {
        registration_id,
        otp,
      });

      if (response.data.verified) {
        // Store user data in localStorage after successful verification
        const userData = {
          id: response.data.user_id,
          email: email,
          name: email.split("@")[0], // temporary name until they set their profile
          role: "user",
        };
        localStorage.setItem("user", JSON.stringify(userData));

        // Navigate to personal info page
        navigate("/personalinfo", {
          state: {
            user_id: response.data.user_id,
            email,
          },
        });
      } else {
        setError("Invalid OTP code");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error verifying OTP");

      if (err.response?.data?.error?.includes("expired")) {
        setTimeout(() => {
          navigate("/register");
        }, 3000);
      }
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await axios.post("/resend-otp", {
        registration_id,
      });
      setTimeLeft(60);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Error resending OTP");

      // If registration expired, redirect back to register
      if (err.response?.data?.error?.includes("expired")) {
        setTimeout(() => {
          navigate("/register");
        }, 3000);
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AppTheme>
      <CssBaseline />
      <Box
        sx={{
          padding: "2rem",
          maxWidth: "400px",
          margin: "auto",
          marginTop: "10vh",
          border: "1px solid #eee",
          borderRadius: "20px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h5" gutterBottom>
            ยืนยันตัวตนด้วย OTP
          </Typography>
          <Typography variant="body2" color="text.secondary">
            กรุณากรอกรหัส OTP ที่ได้รับทางอีเมล {email}
          </Typography>

          {error && (
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                required
                label="รหัส OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="กรอกรหัส OTP 6 หลัก"
                fullWidth
                inputProps={{
                  maxLength: 6,
                  pattern: "[0-9]*",
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ textTransform: "none" }}
              >
                ยืนยัน OTP
              </Button>

              <Button
                onClick={handleResendOTP}
                disabled={timeLeft > 0 || isResending}
                variant="text"
                fullWidth
                sx={{ textTransform: "none" }}
              >
                {isResending ? (
                  <CircularProgress size={24} />
                ) : timeLeft > 0 ? (
                  `ส่งรหัสใหม่อีกครั้งใน ${timeLeft} วินาที`
                ) : (
                  "ส่งรหัสใหม่"
                )}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Box>
    </AppTheme>
  );
};

export default OTPVerification;
