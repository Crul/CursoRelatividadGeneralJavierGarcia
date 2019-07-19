clear;clc;clf
% Ejes
axis square
xlim([-2,2])
ylim([-2,2])
hold on

% Rangos
dr=0.18;
dt=0.18;
r_limite = 2;
t_limite = 14;

% ZONA 1
r=1.00001:dr:r_limite;
for t=-t_limite:dt:t_limite
rho = sqrt(r-1).*exp(0.5*r);
X = rho*cosh(0.5*t);
T = rho*sinh(0.5*t);
plot(X,T,'r');
end
t=-t_limite:dt:t_limite;
for r=1.00001:dr:r_limite
rho = sqrt(r-1)*exp(0.5*r);
X = rho*cosh(0.5*t);
T = rho*sinh(0.5*t);
plot(X,T,'b');
end

% ZONA 2
r=0.99999:-dr:0;
for t=-t_limite:dt:t_limite
rho = sqrt(1-r).*exp(0.5*r);
X = rho*sinh(0.5*t);
T = rho*cosh(0.5*t);
plot(X,T,'r');
end
t=-t_limite:dt:t_limite;
for r=0.99999:-dr:0
rho = sqrt(1-r).*exp(0.5*r);
X = rho*sinh(0.5*t);
T = rho*cosh(0.5*t);
plot(X,T,'b');
end

% ZONA 3
r=1.00001:dr:r_limite;
for t=-t_limite:dt:t_limite
rho = sqrt(r-1).*exp(0.5*r);
X = -rho*cosh(0.5*t);
T = -rho*sinh(0.5*t);
plot(X,T,'r');
end
t=-t_limite:dt:t_limite;
for r=1.00001:dr:r_limite
rho = sqrt(r-1)*exp(0.5*r);
X = -rho*cosh(0.5*t);
T = -rho*sinh(0.5*t);
plot(X,T,'b');
end

% ZONA 4
r=0.99999:-dr:0;
for t=-t_limite:dt:t_limite
rho = sqrt(1-r).*exp(0.5*r);
X = -rho*sinh(0.5*t);
T = -rho*cosh(0.5*t);
plot(X,T,'r');
end
t=-t_limite:dt:t_limite;
for r=0.99999:-dr:0
rho = sqrt(1-r).*exp(0.5*r);
X = -rho*sinh(0.5*t);
T = -rho*cosh(0.5*t);
plot(X,T,'b');
end

hold off